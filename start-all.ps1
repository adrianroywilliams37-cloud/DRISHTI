Write-Host "Starting INFRA-PULSE Web Portal, Mobile App, and AI Backend..." -ForegroundColor Cyan

Start-Process "cmd.exe" -ArgumentList "/k npm run dev" -Title "Web Portal"
Start-Process "cmd.exe" -ArgumentList "/k cd infrapulse-mobile && npx expo start -c --lan" -Title "Mobile App"
Start-Process "cmd.exe" -ArgumentList "/k cd ml_engine && .\venv\Scripts\python.exe -m uvicorn main:app --port 8000 --host 0.0.0.0 --reload" -Title "AI Backend"

Write-Host "All environments have been started in separate windows." -ForegroundColor Green
