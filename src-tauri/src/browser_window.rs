#[cfg(target_os = "windows")]
mod platform_windows {
  use ::windows::core::BOOL;
  use ::windows::Win32::Foundation::{HWND, LPARAM};
  use ::windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindow, GetWindowThreadProcessId, IsWindowVisible, SetForegroundWindow,
    ShowWindow, GW_OWNER, SW_MINIMIZE, SW_RESTORE,
  };

  #[derive(Clone, Copy)]
  enum WindowAction {
    Minimize,
    Restore,
  }

  struct EnumContext {
    pid: u32,
    action: WindowAction,
    matched: bool,
  }

  unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
    // SAFETY: lparam contains a valid mutable EnumContext pointer from our call site.
    let ctx = unsafe { &mut *(lparam.0 as *mut EnumContext) };

    let mut window_pid = 0u32;
    // SAFETY: hwnd is provided by EnumWindows and valid for this callback.
    unsafe {
      GetWindowThreadProcessId(hwnd, Some(&mut window_pid));
    }

    if window_pid != ctx.pid {
      return BOOL(1);
    }

    // Skip invisible/owned windows to target top-level browser windows.
    // SAFETY: hwnd is valid during callback.
    let is_visible = unsafe { IsWindowVisible(hwnd).as_bool() };
    if !is_visible {
      return BOOL(1);
    }
    // SAFETY: hwnd is valid during callback.
    let Ok(owner) = (unsafe { GetWindow(hwnd, GW_OWNER) }) else {
      return BOOL(1);
    };
    if !owner.is_invalid() {
      return BOOL(1);
    }

    match ctx.action {
      WindowAction::Minimize => {
        // SAFETY: hwnd belongs to an active top-level window.
        let _ = unsafe { ShowWindow(hwnd, SW_MINIMIZE) };
      }
      WindowAction::Restore => {
        // SAFETY: hwnd belongs to an active top-level window.
        let _ = unsafe { ShowWindow(hwnd, SW_RESTORE) };
        // Best-effort bring-to-front for resume UX.
        // SAFETY: hwnd belongs to an active top-level window.
        let _ = unsafe { SetForegroundWindow(hwnd) };
      }
    }

    ctx.matched = true;
    BOOL(1)
  }

  fn apply_window_action(pid: u32, action: WindowAction) -> Result<(), String> {
    let mut ctx = EnumContext {
      pid,
      action,
      matched: false,
    };

    // SAFETY: callback and context pointer remain valid for the call duration.
    let _ = unsafe {
      EnumWindows(
        Some(enum_windows_proc),
        LPARAM((&mut ctx as *mut EnumContext) as isize),
      )
    };

    if !ctx.matched {
      return Err(format!("No top-level window found for PID {pid}"));
    }

    Ok(())
  }

  pub fn minimize_for_pid(pid: u32) -> Result<(), String> {
    apply_window_action(pid, WindowAction::Minimize)
  }

  pub fn restore_for_pid(pid: u32) -> Result<(), String> {
    apply_window_action(pid, WindowAction::Restore)
  }
}

pub fn minimize_for_pid(pid: Option<u32>) -> Result<(), String> {
  let Some(pid) = pid else {
    return Ok(());
  };

  #[cfg(target_os = "windows")]
  {
    return platform_windows::minimize_for_pid(pid);
  }

  #[cfg(not(target_os = "windows"))]
  {
    let _ = pid;
    Ok(())
  }
}

pub fn restore_for_pid(pid: Option<u32>) -> Result<(), String> {
  let Some(pid) = pid else {
    return Ok(());
  };

  #[cfg(target_os = "windows")]
  {
    return platform_windows::restore_for_pid(pid);
  }

  #[cfg(not(target_os = "windows"))]
  {
    let _ = pid;
    Ok(())
  }
}
