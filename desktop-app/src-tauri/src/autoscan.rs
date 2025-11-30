use crate::{storage, AppState};
use std::sync::Arc;
use tauri::{AppHandle, Manager, async_runtime};
use tokio::time::{Duration, interval};

/// Start the auto-scan background scheduler
pub fn start_scheduler(app: AppHandle) {
    async_runtime::spawn(async move {
        // Wait a bit after startup before first check
        tokio::time::sleep(Duration::from_secs(10)).await;

        // Run initial check
        check_and_run_auto_scans(&app).await;

        // Then check every 5 minutes
        let mut interval = interval(Duration::from_secs(5 * 60));
        loop {
            interval.tick().await;
            check_and_run_auto_scans(&app).await;
        }
    });
}

/// Check if auto-scans should run and execute them for all products
async fn check_and_run_auto_scans(app: &AppHandle) {
    let state = match app.try_state::<Arc<AppState>>() {
        Some(s) => s,
        None => {
            eprintln!("[AutoScan] AppState not available");
            return;
        }
    };

    // Check if user is authenticated
    let is_authenticated = {
        let auth = state.auth.lock();
        auth.user.is_some() && auth.access_token.is_some()
    };

    if !is_authenticated {
        println!("[AutoScan] Not authenticated, skipping auto-scan check");
        return;
    }

    // Get current date
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    // Get all product configs
    let product_configs = storage::get_all_product_configs();

    if product_configs.is_empty() {
        println!("[AutoScan] No product configurations found");
        return;
    }

    println!("[AutoScan] Checking {} products for auto-scans", product_configs.len());

    // Iterate over all products
    for (product_id, mut config) in product_configs {
        // Skip if auto-run is disabled for this product
        if !config.auto_run_enabled {
            println!("[AutoScan] Product {} has auto-run disabled, skipping", product_id);
            continue;
        }

        // Skip if no platforms configured
        if config.ready_platforms.is_empty() {
            println!("[AutoScan] Product {} has no platforms configured, skipping", product_id);
            continue;
        }

        // Reset counter if it's a new day
        let actual_scans_today = if config.last_auto_scan_date.as_ref() != Some(&today) {
            println!("[AutoScan] New day for product {}, resetting scan counter", product_id);
            config.last_auto_scan_date = Some(today.clone());
            config.scans_today = 0;
            let _ = storage::update_product_config(&product_id, &config);
            0
        } else {
            config.scans_today
        };

        // Calculate how many scans to run
        let remaining_scans = config.scans_per_day.saturating_sub(actual_scans_today);

        if remaining_scans == 0 {
            println!("[AutoScan] Product {} already completed {} scans today",
                product_id, config.scans_per_day);
            continue;
        }

        println!("[AutoScan] Product {} needs {} more scans today (completed: {}/{})",
            product_id, remaining_scans, actual_scans_today, config.scans_per_day);

        // Check if a scan is already running
        {
            let scan = state.scan.lock();
            if scan.is_running {
                println!("[AutoScan] Scan already in progress, waiting");
                return; // Exit completely, will retry next interval
            }
        }

        // Run the remaining scans one by one for this product
        for scan_num in 0..remaining_scans {
            println!("[AutoScan] Starting auto-scan {}/{} for product {}",
                scan_num + 1, remaining_scans, product_id);

            // Check again if scan is running (might have been started manually)
            {
                let scan = state.scan.lock();
                if scan.is_running {
                    println!("[AutoScan] Scan started externally, aborting auto-scan batch");
                    return;
                }
            }

            // Run the scan
            match run_auto_scan(
                app,
                &state,
                &product_id,
                config.samples_per_prompt as usize,
                &config.ready_platforms,
            ).await {
                Ok(_) => {
                    println!("[AutoScan] Auto-scan {} for product {} completed successfully",
                        scan_num + 1, product_id);

                    // Reload config and increment the counter
                    let mut updated_config = storage::get_product_config(&product_id);
                    updated_config.scans_today += 1;
                    updated_config.last_auto_scan_date = Some(today.clone());
                    let _ = storage::update_product_config(&product_id, &updated_config);
                }
                Err(e) => {
                    eprintln!("[AutoScan] Auto-scan {} for product {} failed: {}",
                        scan_num + 1, product_id, e);
                    // Don't increment counter on failure, but continue with next scan
                }
            }

            // Wait a bit between scans to avoid overwhelming the system
            if scan_num + 1 < remaining_scans {
                println!("[AutoScan] Waiting 30 seconds before next scan...");
                tokio::time::sleep(Duration::from_secs(30)).await;
            }
        }

        // Wait between products too
        println!("[AutoScan] Waiting 60 seconds before next product...");
        tokio::time::sleep(Duration::from_secs(60)).await;
    }

    println!("[AutoScan] Auto-scan check complete");
}

/// Run a single auto-scan by invoking the command through Tauri
async fn run_auto_scan(
    app: &AppHandle,
    state: &Arc<AppState>,
    product_id: &str,
    samples_per_prompt: usize,
    platforms: &[String],
) -> Result<(), String> {
    use crate::commands::scan::start_scan_internal;

    start_scan_internal(
        product_id.to_string(),
        Some(samples_per_prompt),
        Some(platforms.to_vec()),
        app.clone(),
        state.clone(),
    ).await?;

    // Wait for the scan to complete
    loop {
        tokio::time::sleep(Duration::from_secs(5)).await;

        let is_running = {
            let scan = state.scan.lock();
            scan.is_running
        };

        if !is_running {
            break;
        }
    }

    Ok(())
}
