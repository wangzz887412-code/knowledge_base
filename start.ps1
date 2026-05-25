# Knowledge Base Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Knowledge Base Website" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "D:\trae\knowledge_base2.0"
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$PostgreSQLDir = Join-Path $ProjectRoot "PostgreSQL"
$RedisDir = Join-Path $ProjectRoot "Redis"

Write-Host "Project: $ProjectRoot" -ForegroundColor Green
Write-Host ""

# Step 1: Backend Setup
Write-Host "[1/7] Checking backend..." -ForegroundColor Yellow

Push-Location $BackendDir
if (-not (Test-Path "venv")) {
    Write-Host "Creating venv..." -ForegroundColor Cyan
    python -m venv venv
}

if (Test-Path "venv\Scripts\Activate.ps1") {
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt -q
} else {
    Write-Error "Venv not found!"
    exit 1
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

python manage.py migrate --noinput 2>$null
Pop-Location
Write-Host "Backend ready!" -ForegroundColor Green
Write-Host ""

# Step 2: Frontend Setup
Write-Host "[2/7] Checking frontend..." -ForegroundColor Yellow

Push-Location $FrontendDir
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}
Pop-Location
Write-Host "Frontend ready!" -ForegroundColor Green
Write-Host ""

# Step 3: PostgreSQL
Write-Host "[3/7] Starting PostgreSQL..." -ForegroundColor Yellow
$PgCtl = Join-Path $PostgreSQLDir "bin\pg_ctl.exe"
$PgData = Join-Path $PostgreSQLDir "data"

if (Test-Path $PgCtl) {
    $status = & $PgCtl status -D $PgData 2>&1
    if ($status -match "no server running") {
        & $PgCtl start -D $PgData -l "$PostgreSQLDir\logfile" 2>$null | Out-Null
        Start-Sleep 2
        Write-Host "PostgreSQL started!" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL already running!" -ForegroundColor Green
    }
}
Write-Host ""

# Step 4: Redis/Memurai
Write-Host "[4/7] Starting Redis/Memurai..." -ForegroundColor Yellow
$MemuraiCli = Join-Path $RedisDir "memurai-cli.exe"

if (Test-Path $MemuraiCli) {
    try {
        $test = & $MemuraiCli ping 2>&1
        if ($test -ne "PONG") {
            Start-Process (Join-Path $RedisDir "memurai.exe") -WorkingDirectory $RedisDir -WindowStyle Hidden
            Start-Sleep 2
            Write-Host "Memurai started!" -ForegroundColor Green
        } else {
            Write-Host "Memurai already running!" -ForegroundColor Green
        }
    } catch {
        Start-Process (Join-Path $RedisDir "memurai.exe") -WorkingDirectory $RedisDir -WindowStyle Hidden
        Start-Sleep 2
        Write-Host "Memurai started!" -ForegroundColor Green
    }
}
Write-Host ""

# Step 5-7: Ready to start services
Write-Host "[5/7] Backend server ready" -ForegroundColor Yellow
Write-Host "[6/7] Celery worker ready" -ForegroundColor Yellow  
Write-Host "[7/7] Frontend server ready" -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All systems ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access:" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  API:      http://localhost:8000/api" -ForegroundColor White
Write-Host ""

$Choice = Read-Host "Start all services? (Y/N)"
if ($Choice -eq "Y" -or $Choice -eq "y") {
    Write-Host "Starting services..." -ForegroundColor Cyan
    
    # Start Django
    $bScript = @"
cd $BackendDir
.\venv\Scripts\Activate.ps1
python manage.py runserver
"@
    Set-Content -Path "$ProjectRoot\_start_backend.ps1" -Value $bScript
    Start-Process powershell -ArgumentList "-NoExit", "-File", "$ProjectRoot\_start_backend.ps1"
    
    # Start Celery
    $cScript = @"
cd $BackendDir
.\venv\Scripts\Activate.ps1
celery -A config worker -l INFO -P solo
"@
    Set-Content -Path "$ProjectRoot\_start_celery.ps1" -Value $cScript
    Start-Process powershell -ArgumentList "-NoExit", "-File", "$ProjectRoot\_start_celery.ps1"
    
    # Start Frontend
    $fScript = @"
cd $FrontendDir
npm run dev
"@
    Set-Content -Path "$ProjectRoot\_start_frontend.ps1" -Value $fScript
    Start-Process powershell -ArgumentList "-NoExit", "-File", "$ProjectRoot\_start_frontend.ps1"
    
    Write-Host "" 
    Write-Host "All services started in new windows!" -ForegroundColor Green
    Start-Sleep 2
    
    # Cleanup temp scripts
    Remove-Item "$ProjectRoot\_start_*.ps1" -ErrorAction SilentlyContinue
} else {
    Write-Host "Cancelled." -ForegroundColor Yellow
}
