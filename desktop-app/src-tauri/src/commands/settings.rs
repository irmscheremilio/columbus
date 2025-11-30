use crate::{storage::{self, ProductConfig}, AppState};
use std::sync::Arc;
use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

/// Get config for a specific product
#[tauri::command]
pub async fn get_product_config(product_id: String) -> Result<ProductConfig, String> {
    let config = storage::get_product_config(&product_id);
    println!("[Settings] get_product_config for {}: platforms={:?}, auto_run={}, scans_per_day={}",
        product_id, config.ready_platforms, config.auto_run_enabled, config.scans_per_day);
    Ok(config)
}

/// Set config for a specific product
#[tauri::command]
pub async fn set_product_config(
    product_id: String,
    ready_platforms: Vec<String>,
    samples_per_prompt: u32,
    auto_run_enabled: bool,
    scans_per_day: u32,
) -> Result<ProductConfig, String> {
    println!("[Settings] set_product_config for {}: platforms={:?}, auto_run={}, scans_per_day={}",
        product_id, ready_platforms, auto_run_enabled, scans_per_day);

    let config = ProductConfig {
        ready_platforms,
        samples_per_prompt: samples_per_prompt.max(1),
        auto_run_enabled,
        scans_per_day: scans_per_day.max(1).min(24),
        last_auto_scan_date: storage::get_product_config(&product_id).last_auto_scan_date,
        scans_today: storage::get_product_config(&product_id).scans_today,
    };

    // Persist config to disk
    if let Err(e) = storage::update_product_config(&product_id, &config) {
        eprintln!("[Settings] Failed to persist product config: {}", e);
        return Err(format!("Failed to save config: {}", e));
    }

    println!("[Settings] Product config persisted successfully");
    Ok(config)
}

#[tauri::command]
pub async fn get_last_product_id(
    state: tauri::State<'_, Arc<AppState>>,
) -> Result<Option<String>, String> {
    let product_id = state.last_product_id.lock().clone();
    Ok(product_id)
}

#[tauri::command]
pub async fn set_last_product_id(
    state: tauri::State<'_, Arc<AppState>>,
    product_id: Option<String>,
) -> Result<(), String> {
    println!("[Settings] set_last_product_id called: {:?}", product_id);

    {
        let mut last_product = state.last_product_id.lock();
        *last_product = product_id.clone();
    }

    // Persist to disk
    if let Err(e) = storage::update_last_product(product_id) {
        eprintln!("[Settings] Failed to persist last product: {}", e);
    } else {
        println!("[Settings] Last product persisted successfully");
    }

    Ok(())
}

#[tauri::command]
pub async fn get_autostart_enabled(app: AppHandle) -> Result<bool, String> {
    let autostart_manager = app.autolaunch();
    autostart_manager
        .is_enabled()
        .map_err(|e| format!("Failed to get autostart status: {}", e))
}

#[tauri::command]
pub async fn set_autostart_enabled(app: AppHandle, enabled: bool) -> Result<bool, String> {
    let autostart_manager = app.autolaunch();

    if enabled {
        autostart_manager
            .enable()
            .map_err(|e| format!("Failed to enable autostart: {}", e))?;
    } else {
        autostart_manager
            .disable()
            .map_err(|e| format!("Failed to disable autostart: {}", e))?;
    }

    // Return the new state
    autostart_manager
        .is_enabled()
        .map_err(|e| format!("Failed to verify autostart status: {}", e))
}
