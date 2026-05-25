# 知识库网站停止脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  停止知识库网站服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PostgreSQLDir = Join-Path $ProjectRoot "PostgreSQL"

# 停止 PostgreSQL
Write-Host "[1/3] 停止 PostgreSQL..." -ForegroundColor Yellow
$PgBinDir = Join-Path $PostgreSQLDir "bin"
$PgDataDir = Join-Path $PostgreSQLDir "data"
$PgCtl = Join-Path $PgBinDir "pg_ctl.exe"

if (Test-Path $PgCtl) {
    Write-Host "正在停止 PostgreSQL 服务..." -ForegroundColor Cyan
    & $PgCtl stop -D $PgDataDir -m fast
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL 已停止！" -ForegroundColor Green
    } else {
        Write-Warning "PostgreSQL 可能未运行或停止失败"
    }
}
Write-Host ""

# 停止 Redis/Memurai
Write-Host "[2/3] 停止 Redis/Memurai..." -ForegroundColor Yellow
$RedisDir = Join-Path $ProjectRoot "Redis"
$MemuraiCli = Join-Path $RedisDir "memurai-cli.exe"

if (Test-Path $MemuraiCli) {
    Write-Host "正在停止 Memurai 服务..." -ForegroundColor Cyan
    try {
        & $MemuraiCli shutdown 2>&1 | Out-Null
        Start-Sleep -Seconds 1
        Write-Host "Memurai 已停止！" -ForegroundColor Green
    } catch {
        Write-Warning "Memurai 可能未运行"
    }
}
Write-Host ""

# 清理临时脚本
Write-Host "[3/3] 清理临时启动脚本..." -ForegroundColor Yellow
$TempScripts = @(
    "start-backend.ps1",
    "start-celery.ps1", 
    "start-frontend.ps1"
)

foreach ($Script in $TempScripts) {
    $ScriptPath = Join-Path $ProjectRoot $Script
    if (Test-Path $ScriptPath) {
        Remove-Item $ScriptPath -Force
        Write-Host "已删除: $Script" -ForegroundColor Cyan
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  停止完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "注意: 其他 PowerShell 窗口需要手动关闭。" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
