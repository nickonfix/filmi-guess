# Start FilmiGuess dev servers
Write-Host "Starting FilmiGuess..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location E:\gamesite\server; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location E:\gamesite\client; npm run dev"

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "Your machine:   http://localhost:3000" -ForegroundColor Green
Write-Host "Friends (WiFi): http://${ip}:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "First time? Run setup_firewall.ps1 as Administrator so friends can connect." -ForegroundColor Yellow
Write-Host ""
