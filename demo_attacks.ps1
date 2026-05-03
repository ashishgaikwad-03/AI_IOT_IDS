# AI-IDS Demonstration Injection Script
# ----------------------------------------------------
# This script sends simulated attack signals to the 
# IDS Dashboard backend. It does NOT generate real 
# malicious packets on your network, making it 100% 
# safe to run on enterprise/university Wi-Fi.
# ----------------------------------------------------

$BackendUrl = "http://localhost:8000/api/inject-attack"

function Trigger-Attack {
    param (
        [string]$Name,
        [string]$Type,
        [string]$SourceIp,
        [string]$DestIp,
        [int]$Count = 10,
        [int]$DelayMs = 50
    )
    
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "🚀 LAUNCHING ATTACK: $Name" -ForegroundColor Yellow
    Write-Host "Attacker: $SourceIp --> Target: $DestIp" -ForegroundColor DarkGray
    Write-Host "=============================================" -ForegroundColor Cyan

    for ($i = 1; $i -le $Count; $i++) {
        $Uri = "$BackendUrl`?attack_type=$Type&source_ip=$SourceIp&dest_ip=$DestIp"
        try {
            $response = Invoke-RestMethod -Method Post -Uri $Uri -ErrorAction Stop
            Write-Host " [$i/$Count] Injected packet --> Classified as: $($response.classification)" -ForegroundColor Green
        } catch {
            Write-Host " [$i/$Count] Failed to inject. Is the backend running on port 8000?" -ForegroundColor Red
            break
        }
        Start-Sleep -Milliseconds $DelayMs
    }
    Write-Host "`n✅ Attack Simulation Complete.`n" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# ----------------------------------------------------
# DEMO 1: DoS-SYN Flood (Denial of Service)
# A huge volume of connection requests from one IP.
# ----------------------------------------------------
Trigger-Attack -Name "DoS-SYN Flood" -Type "dos" -SourceIp "82.14.99.102" -DestIp "192.168.1.10" -Count 20 -DelayMs 100

# ----------------------------------------------------
# DEMO 2: Mirai-UDP (Botnet DDoS Flood)
# Massive bandwidth consumption from multiple sources.
# ----------------------------------------------------
# Simulating a distributed attack by rapidly changing the source IP of the botnet
$BotnetIPs = @("10.0.0.99", "45.22.19.1", "112.55.9.8", "77.8.2.19")
foreach ($bot in $BotnetIPs) {
    Trigger-Attack -Name "Mirai-UDP (Botnet Source: $bot)" -Type "botnet" -SourceIp $bot -DestIp "192.168.1.1" -Count 8 -DelayMs 50
}

# ----------------------------------------------------
# DEMO 3: Port Scan (Reconnaissance)
# Looking for open doors on a specific server.
# ----------------------------------------------------
Trigger-Attack -Name "Nmap Port Scan" -Type "scan" -SourceIp "192.168.1.45" -DestIp "10.0.0.5" -Count 15 -DelayMs 200

# ----------------------------------------------------
# DEMO 4: MITM-ARP (Hardware Layer Hijacking)
# Malicious internal device stealing the router's identity.
# ----------------------------------------------------
Trigger-Attack -Name "ARP Spoofing (MITM)" -Type "theft" -SourceIp "192.168.1.200" -DestIp "192.168.1.255" -Count 12 -DelayMs 300

# ----------------------------------------------------
# DEMO 5: Telnet Brute Force (Application Layer)
# Rapid password guessing against an old server.
# ----------------------------------------------------
Trigger-Attack -Name "Hydra Telnet Brute-Force" -Type "brute" -SourceIp "172.16.0.4" -DestIp "192.168.1.50" -Count 30 -DelayMs 50

Write-Host "🎉 ALL DEMONSTRATIONS FINISHED! Check the dashboard." -ForegroundColor Magenta
