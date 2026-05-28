$WshShell = New-Object -comObject WScript.Shell
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\KnowledgeBase.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File ""$ScriptPath\start-simple.ps1"""
$Shortcut.WorkingDirectory = $ScriptPath
$Shortcut.IconLocation = "shell32.dll,17"
$Shortcut.Description = "Start Knowledge Base Website"
$Shortcut.Save()

Write-Host "Shortcut created: $env:USERPROFILE\Desktop\KnowledgeBase.lnk" -ForegroundColor Green
Write-Host ""
Write-Host "You can now double-click the shortcut on your desktop to start the website!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host
