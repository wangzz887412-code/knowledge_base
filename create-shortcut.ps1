$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\KnowledgeBase.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File ""D:\trae\knowledge_base2.0\start-website.ps1"""
$Shortcut.WorkingDirectory = "D:\trae\knowledge_base2.0"
$Shortcut.IconLocation = "shell32.dll,17"
$Shortcut.Description = "Start Knowledge Base Website"
$Shortcut.Save()

Write-Host "Shortcut created: $env:USERPROFILE\Desktop\KnowledgeBase.lnk"