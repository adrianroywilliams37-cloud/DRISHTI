@echo off
echo Starting DRISHTI Web Portal, Mobile App, and AI Backend...

start "Web Portal" cmd /k "npm run dev"
start "Mobile App" cmd /k "cd infrapulse-mobile && npx expo start -c --lan"
start "AI Backend" cmd /k "cd ml_engine && .\venv\Scripts\python.exe -m uvicorn main:app --port 8000 --host 0.0.0.0 --reload"

echo All environments have been started in separate windows.
