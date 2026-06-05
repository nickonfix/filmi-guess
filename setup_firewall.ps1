# Run this ONCE as Administrator to allow friends on your WiFi to join
# Right-click this file → "Run with PowerShell" (as Administrator)

$rules = Get-NetFirewallRule -DisplayName "FilmiGuess*" -ErrorAction SilentlyContinue
if ($rules) {
    Write-Host "Firewall rules already exist." -ForegroundColor Yellow
} else {
    New-NetFirewallRule -DisplayName "FilmiGuess Client (3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
    New-NetFirewallRule -DisplayName "FilmiGuess Server (3001)" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any
    Write-Host "Firewall rules added!" -ForegroundColor Green
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "Your share link: http://${ip}:3000" -ForegroundColor Cyan
Write-Host "Share this with friends on the same WiFi." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close"
