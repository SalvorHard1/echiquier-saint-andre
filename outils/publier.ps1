# Prépare une mise en ligne : change le numéro de version partout et vérifie le hors-ligne.
#
#   Sans paramètre      : vérifie seulement (même version dans js/version.js et sw.js,
#                         chaque fichier du site présent dans la liste FICHIERS de sw.js).
#   -Version 0.12 -Nouveautes "Ajout 1|Ajout 2"
#                       : met 0.12 dans js/version.js et sw.js, ajoute l'entrée en tête
#                         du journal des nouveautés, puis vérifie.
#   -Demander           : pose les questions (utilisé par Publier.bat).
param(
  [string]$Version,
  [string[]]$Nouveautes,
  [switch]$Demander
)
$ErrorActionPreference = 'Stop'
$racine = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object Text.UTF8Encoding($false)
$cheminVersion = Join-Path $racine 'js\version.js'
$cheminSw = Join-Path $racine 'sw.js'

function Lire($chemin) { [IO.File]::ReadAllText($chemin, $utf8) }
function Ecrire($chemin, $texte) { [IO.File]::WriteAllText($chemin, $texte, $utf8) }
function VersionDe($texte) {
  $m = [regex]::Match($texte, "const VERSION = '([^']*)'")
  if ($m.Success) { $m.Groups[1].Value } else { $null }
}

$jsVersion = Lire $cheminVersion
$sw = Lire $cheminSw

if ($Demander) {
  Write-Host ""
  Write-Host "  Version actuelle : $(VersionDe $jsVersion)" -ForegroundColor Cyan
  $Version = (Read-Host "  Nouvelle version (vide = vérifier seulement)").Trim()
  if ($Version) {
    Write-Host "  Nouveautés, une par ligne (ligne vide pour finir) :"
    $Nouveautes = @()
    while ($true) {
      $ligne = (Read-Host "   -").Trim()
      if (-not $ligne) { break }
      $Nouveautes += $ligne
    }
  }
}

# ---------- Nouvelle version ----------

if ($Version) {
  if ($Version -notmatch '^\d+\.\d+$') {
    Write-Host "  Version invalide : « $Version » (exemple : 0.12)." -ForegroundColor Red
    exit 1
  }
  if ($Version -eq (VersionDe $jsVersion)) {
    Write-Host "  La version $Version est déjà la version actuelle." -ForegroundColor Red
    exit 1
  }
  # Depuis la ligne de commande (-File), les nouveautés arrivent en une seule chaîne séparée par « | ».
  $Nouveautes = @($Nouveautes | ForEach-Object { $_ -split '\|' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  if (-not $Nouveautes) {
    Write-Host "  Indique au moins une nouveauté (-Nouveautes `"...`")." -ForegroundColor Red
    exit 1
  }
  # Apostrophe typographique, comme dans le reste du journal (et pour ne pas casser les chaînes JS).
  $lignes = ($Nouveautes | ForEach-Object { "      '$($_.Replace([string][char]39, [string][char]0x2019))'," }) -join "`n"
  $entree = "export const NOUVEAUTES = [`n  {`n    version: '$Version', date: '$(Get-Date -Format 'yyyy-MM-dd')',`n    changements: [`n$lignes`n    ],`n  },"
  $jsVersion = $jsVersion -replace "export const VERSION = '[^']*'", "export const VERSION = '$Version'"
  $jsVersion = $jsVersion.Replace('export const NOUVEAUTES = [', $entree)
  $sw = $sw -replace "const VERSION = '[^']*'", "const VERSION = '$Version'"
  Ecrire $cheminVersion $jsVersion
  Ecrire $cheminSw $sw
  Write-Host "  Version $Version écrite dans js/version.js et sw.js." -ForegroundColor Green
}

# ---------- Vérifications ----------

$erreurs = 0
$vJs = VersionDe $jsVersion
$vSw = VersionDe $sw
if ($vJs -ne $vSw) {
  Write-Host "  Versions différentes : js/version.js = $vJs, sw.js = $vSw." -ForegroundColor Red
  $erreurs++
}

$bloc = [regex]::Match($sw, 'const FICHIERS = \[([\s\S]*?)\];').Groups[1].Value
$listes = [regex]::Matches($bloc, "'([^']+)'") | ForEach-Object { $_.Groups[1].Value } |
  Where-Object { $_ -ne './' -and $_ -notmatch '\$\{' -and $_ -notmatch '^[wbKQRBNP]$' }
# Les pièces sont listées par une boucle dans sw.js.
if ($bloc -match 'assets/pieces/') {
  $listes += foreach ($c in 'w', 'b') { foreach ($p in 'K', 'Q', 'R', 'B', 'N', 'P') { "assets/pieces/$c$p.svg" } }
}

$site = @('index.html', 'manifest.webmanifest')
foreach ($dossier in 'css', 'js', 'vendor', 'data', 'assets') {
  $site += Get-ChildItem (Join-Path $racine $dossier) -Recurse -File |
    Where-Object { $_.Name -notin 'LICENSE', 'Copying.txt' } |
    ForEach-Object { $_.FullName.Substring($racine.Length + 1).Replace('\', '/') }
}

foreach ($f in $site) {
  if ($f -cnotin $listes) {
    Write-Host "  Absent de FICHIERS (sw.js) : $f" -ForegroundColor Red
    $erreurs++
  }
}
foreach ($f in $listes) {
  if (-not (Test-Path (Join-Path $racine $f))) {
    Write-Host "  Listé dans FICHIERS mais introuvable : $f" -ForegroundColor Red
    $erreurs++
  }
}

if ($erreurs) {
  Write-Host "  $erreurs problème(s) à corriger avant la mise en ligne." -ForegroundColor Red
  exit 1
}
Write-Host "  Tout est prêt pour la version $vJs ($($listes.Count) fichiers pour le hors-ligne)." -ForegroundColor Green
Write-Host "  Envoie maintenant les fichiers modifiés sur GitHub, sans oublier js/version.js et sw.js."
