$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

function Find-Python {
    foreach ($cmd in @("python","py","python3")) {
        try {
            $found = Get-Command $cmd -ErrorAction Stop
            if ($found) { return $cmd }
        } catch {}
    }
    return $null
}

$py = Find-Python
if (-not $py) {
    Write-Host "[ОШИБКА] Python не найден." -ForegroundColor Red
    Read-Host "Enter"
    exit 1
}

Write-Host "Python:"
& $py --version
Write-Host ""

$need = $false
try {
    & $py -c "import selenium, requests" 2>$null
    if ($LASTEXITCODE -ne 0) { $need = $true }
} catch { $need = $true }

if ($need) {
    Write-Host "Устанавливаю зависимости..." -ForegroundColor Yellow
    & $py -m pip install -r ".\requirements.txt"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ОШИБКА] Не удалось установить зависимости." -ForegroundColor Red
        Read-Host "Enter"
        exit 1
    }
}

Write-Host ""
Write-Host "Запускаю v11.0 TURBO SPLIT..." -ForegroundColor Green
& $py ".\parser.py"
