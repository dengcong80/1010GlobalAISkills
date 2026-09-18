$ErrorActionPreference = "Stop"

$appRoot = Split-Path -Parent $PSScriptRoot
$distRoot = Join-Path $appRoot "dist"
$staging = Join-Path $distRoot "trackb-package"
$output = Join-Path $distRoot "beetrust-trackb-spa.zip"

if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging -Force | Out-Null

$relativeItems = @(
    "track-b-package.json",
    "evidence-source-register.json",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "README.md",
    "DESIGN.md",
    "skills",
    "src"
)

foreach ($relativeItem in $relativeItems) {
    $source = Join-Path $appRoot $relativeItem
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Missing package item: $relativeItem"
    }
    $destination = Join-Path $staging $relativeItem
    Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $output -Force
Write-Output "PACKAGE_CREATED=$output"
