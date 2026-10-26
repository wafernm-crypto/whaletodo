# 启动打包好的应用并截图，用于验收真实窗口
param(
  [string]$Exe = "C:\Users\Administrator\whaletodo-test\鲸鱼待办.exe",
  [string]$Out = "S:\23_DshMod\whaletodo\build\app-shot.png",
  [int]$WaitSeconds = 8
)

Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$proc = Start-Process -FilePath $Exe -PassThru
Start-Sleep -Seconds $WaitSeconds

if ($proc.HasExited) {
  Write-Host "APP_EXITED code=$($proc.ExitCode)"
  exit 1
}
Write-Host "APP_RUNNING pid=$($proc.Id) title='$($proc.MainWindowTitle)'"

$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
Write-Host "SCREEN $($bounds.Width)x$($bounds.Height)"
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bmp.Size)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "SAVED $Out"

Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
