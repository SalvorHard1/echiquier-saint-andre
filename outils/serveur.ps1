# Petit serveur web local pour tester l'application (aucune installation nécessaire).
# Accessible uniquement depuis cet ordinateur (localhost).
$ErrorActionPreference = 'Stop'
$racine = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd('\') + '\'

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.wasm' = 'application/wasm'
  '.webmanifest' = 'application/manifest+json'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
}

# Toujours le port 8080 : le navigateur range la progression (hauts faits) par adresse, port compris.
# Changer de port donnerait une sauvegarde vide. Seul l'aperçu de Claude (SANS_NAVIGATEUR) peut en prendre un autre.
$ports = if ($env:SANS_NAVIGATEUR) { 8080..8099 } else { @(8080) }
$serveur = $null
foreach ($p in $ports) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $serveur = $l
    $port = $p
    break
  } catch { }
}
if (-not $serveur) {
  Write-Host ""
  # Le port 8080 est pris : est-ce déjà l'application, ou un autre programme ?
  $dejaOuverte = $false
  try {
    $rep = Invoke-WebRequest -Uri 'http://localhost:8080/manifest.webmanifest' -UseBasicParsing -TimeoutSec 3
    $dejaOuverte = [Text.Encoding]::UTF8.GetString($rep.RawContentStream.ToArray()) -match 'Saint-Andr'
  } catch { }
  if ($dejaOuverte) {
    Write-Host "  L'application tourne déjà dans une autre fenêtre noire." -ForegroundColor Yellow
    Write-Host "  Le navigateur s'ouvre sur http://localhost:8080/ (ta progression y est)."
    Write-Host "  Pour la relancer : ferme d'abord l'autre fenêtre noire."
    if (-not $env:SANS_NAVIGATEUR) { Start-Process 'http://localhost:8080/' }
  } else {
    Write-Host "  Le port 8080 est utilisé par un autre programme." -ForegroundColor Red
    Write-Host "  Ferme ce programme puis relance Lancer.bat."
  }
  Write-Host ""
  exit 1
}

$url = "http://localhost:$port/"
Write-Host ""
Write-Host "  L'Échiquier de Saint-André - serveur de test" -ForegroundColor Cyan
Write-Host "  Adresse : $url" -ForegroundColor Green
Write-Host "  Pour arrêter : ferme cette fenêtre."
Write-Host ""
if (-not $env:SANS_NAVIGATEUR) { Start-Process $url }

try {
  while ($serveur.IsListening) {
    $ctx = $serveur.GetContext()
    $rep = $ctx.Response
    try {
      $chemin = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($chemin -eq '' -or $chemin.EndsWith('/')) { $chemin += 'index.html' }
      $fichier = [IO.Path]::GetFullPath([IO.Path]::Combine($racine, $chemin))
      if ($fichier.StartsWith($racine, [StringComparison]::OrdinalIgnoreCase) -and [IO.File]::Exists($fichier)) {
        $octets = [IO.File]::ReadAllBytes($fichier)
        $ext = [IO.Path]::GetExtension($fichier).ToLowerInvariant()
        $rep.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $rep.Headers.Add('Cache-Control', 'no-store')
        $rep.ContentLength64 = $octets.Length
        $rep.OutputStream.Write($octets, 0, $octets.Length)
        Write-Host "  200  /$chemin" -ForegroundColor DarkGray
      } else {
        $rep.StatusCode = 404
        $octets = [Text.Encoding]::UTF8.GetBytes('404 - fichier introuvable')
        $rep.OutputStream.Write($octets, 0, $octets.Length)
        Write-Host "  404  /$chemin" -ForegroundColor Yellow
      }
    } catch {
      Write-Host "  Erreur : $($_.Exception.Message)" -ForegroundColor Red
    } finally {
      $rep.Close()
    }
  }
} finally {
  $serveur.Stop()
}
