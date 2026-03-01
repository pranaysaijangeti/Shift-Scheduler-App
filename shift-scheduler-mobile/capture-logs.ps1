# Expo Error Log Capture Script
# Run this to capture all Expo output including errors

Write-Host "Starting Expo with log capture..." -ForegroundColor Green
Write-Host "All output will be saved to: expo-logs.txt" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Capture all output (stdout and stderr) to both console and file
npx expo start 2>&1 | Tee-Object -FilePath "expo-logs.txt"

Write-Host ""
Write-Host "Logs saved to: expo-logs.txt" -ForegroundColor Green
Write-Host "You can now view the file to see all errors." -ForegroundColor Green

