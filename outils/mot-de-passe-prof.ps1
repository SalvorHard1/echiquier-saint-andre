# Change le mot de passe de l'espace Prof-AS.
# Seule son empreinte (SHA-256) est écrite dans js/config.js : le mot de passe lui-même n'est enregistré nulle part.
$ErrorActionPreference = 'Stop'
$racine = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object Text.UTF8Encoding($false)
$config = Join-Path $racine 'js\config.js'

Write-Host ""
$secret = Read-Host "  Nouveau mot de passe de l'espace Prof-AS" -AsSecureString
$confirmation = Read-Host "  Confirme le mot de passe" -AsSecureString
$clair = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret))
$clair2 = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmation))
if (-not $clair) {
  Write-Host "  Mot de passe vide : rien n'a changé." -ForegroundColor Red
  exit 1
}
if ($clair -cne $clair2) {
  Write-Host "  Les deux mots de passe sont différents : rien n'a changé." -ForegroundColor Red
  exit 1
}

# Même calcul que dans js/prof.js : SHA-256 de « echiquier-saint-andre: » suivi du mot de passe.
$sha = [Security.Cryptography.SHA256]::Create()
$empreinte = ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes("echiquier-saint-andre:$clair")) | ForEach-Object { $_.ToString('x2') }) -join ''

$texte = [IO.File]::ReadAllText($config, $utf8)
$texte = $texte -replace "motDePasseProf: '[0-9a-f]*'", "motDePasseProf: '$empreinte'"
[IO.File]::WriteAllText($config, $texte, $utf8)
Write-Host "  Mot de passe changé. Envoie js/config.js sur GitHub pour qu'il s'applique au site en ligne." -ForegroundColor Green
