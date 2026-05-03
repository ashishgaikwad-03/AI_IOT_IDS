"""
IDS Alert System — Desktop Toast + Sound + Telegram
Triggers on high-severity attack detections for demo purposes.
"""
import threading
import time
import os
import requests as http_requests

# ─── Configuration ────────────────────────────────────────────────────────────
ALERT_ENABLED = True
ALERT_COOLDOWN_SECONDS = 5        # 1 alert per ~5 seconds
SEVERITY_THRESHOLD = 50           # Only alert on severity >= this value
SOUND_ENABLED = True
TOAST_ENABLED = True
TELEGRAM_ENABLED = True           # Telegram alerts ON

# ─── Telegram Config ─────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = "8761769643:AAGNmfz7Jil42ThtqH8MqciCzDztdSrn10s"
TELEGRAM_CHAT_ID = "915431108"

# ─── Internal State ──────────────────────────────────────────────────────────
_last_alert_time = 0
_alert_count = 0
_lock = threading.Lock()


def _play_sound(severity: int):
    """Play a warning beep using built-in Windows winsound."""
    if not SOUND_ENABLED:
        return
    try:
        import winsound
        if severity >= 85:
            # Critical: 3 rapid high-pitched beeps
            for _ in range(3):
                winsound.Beep(1200, 200)
                time.sleep(0.05)
        elif severity >= 70:
            # High: 2 medium beeps
            for _ in range(2):
                winsound.Beep(900, 250)
                time.sleep(0.1)
        else:
            # Medium: 1 low beep
            winsound.Beep(600, 300)
    except Exception:
        pass  # Not on Windows or winsound unavailable


def _show_toast(title: str, message: str, severity: int):
    """Show a Windows desktop toast notification."""
    if not TOAST_ENABLED:
        return
    try:
        from plyer import notification
        notification.notify(
            title=title,
            message=message,
            app_name="AI IDS Dashboard",
            timeout=6,
        )
    except ImportError:
        # Fallback: try win10toast
        try:
            from win10toast import ToastNotifier
            toaster = ToastNotifier()
            toaster.show_toast(
                title,
                message,
                duration=5,
                threaded=True,
            )
        except ImportError:
            # Last fallback: PowerShell toast (no pip needed!)
            _powershell_toast(title, message)
    except Exception:
        pass


def _powershell_toast(title: str, message: str):
    """Fallback toast using PowerShell — works with ZERO pip installs."""
    try:
        import subprocess
        # Escape quotes for PowerShell
        title_safe = title.replace("'", "''")
        msg_safe = message.replace("'", "''")
        ps_script = f"""
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        $template = @'
        <toast>
            <visual>
                <binding template="ToastGeneric">
                    <text>{title_safe}</text>
                    <text>{msg_safe}</text>
                </binding>
            </visual>
            <audio src="ms-winsoundevent:Notification.Default"/>
        </toast>
'@
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('AI IDS Dashboard')
        $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
        $notifier.Show($toast)
        """
        subprocess.Popen(
            ["powershell", "-WindowStyle", "Hidden", "-Command", ps_script],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0,
        )
    except Exception:
        pass


def _send_telegram(title: str, message: str):
    """Send alert via Telegram Bot API."""
    if not TELEGRAM_ENABLED or not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    try:
        text = f"{title}\n\n{message}"
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        resp = http_requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
        }, timeout=5)
        if resp.status_code == 200:
            print(f"[TELEGRAM] Alert sent successfully")
        else:
            print(f"[TELEGRAM] Failed: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[TELEGRAM] Error: {e}")


# ─── Severity Emoji ──────────────────────────────────────────────────────────
def _severity_icon(severity: int) -> str:
    if severity >= 85:
        return "🔴 CRITICAL"
    elif severity >= 70:
        return "🟠 HIGH"
    elif severity >= 50:
        return "🟡 MEDIUM"
    return "🟢 LOW"


# ─── Main Alert Function ─────────────────────────────────────────────────────
def trigger_alert(payload: dict):
    """
    Called by the backend whenever an attack is broadcast.
    Handles cooldown, severity filtering, and dispatches all alert channels.
    """
    global _last_alert_time, _alert_count

    if not ALERT_ENABLED:
        return

    severity = payload.get("severityScore", 0)
    category = payload.get("category", "benign")

    # Skip benign traffic
    if category == "benign" or severity < SEVERITY_THRESHOLD:
        return

    # Cooldown check (avoid notification spam)
    with _lock:
        now = time.time()
        if now - _last_alert_time < ALERT_COOLDOWN_SECONDS:
            return
        _last_alert_time = now
        _alert_count += 1

    classification = payload.get("classification", "Unknown")
    source_ip = payload.get("sourceIp", "?")
    dest_ip = payload.get("destIp", "?")
    protocol = payload.get("protocol", "?")
    confidence = payload.get("confidence", 0)

    level = _severity_icon(severity)
    title = f"IDS ALERT: {classification}"
    conf_pct = f"{float(confidence)*100:.1f}%" if confidence else "N/A"
    message = (
        f"{level}\n"
        f"Attack: {classification}\n"
        f"From: {source_ip} -> {dest_ip}\n"
        f"Protocol: {protocol} | Severity: {severity}/100\n"
        f"Confidence: {conf_pct}\n"
        f"Alert #{_alert_count}"
    )

    print(f"\n[ALERT] {title}")
    print(f"        {source_ip} -> {dest_ip} [{protocol}] Severity={severity}")

    # Fire all channels in background threads (non-blocking)
    threading.Thread(target=_play_sound, args=(severity,), daemon=True).start()
    threading.Thread(target=_show_toast, args=(title, message, severity), daemon=True).start()
    threading.Thread(target=_send_telegram, args=(title, message), daemon=True).start()


def get_alert_stats():
    """Return alert statistics."""
    return {
        "alerts_sent": _alert_count,
        "alert_enabled": ALERT_ENABLED,
        "sound_enabled": SOUND_ENABLED,
        "toast_enabled": TOAST_ENABLED,
        "telegram_enabled": TELEGRAM_ENABLED,
        "severity_threshold": SEVERITY_THRESHOLD,
        "cooldown_seconds": ALERT_COOLDOWN_SECONDS,
    }
