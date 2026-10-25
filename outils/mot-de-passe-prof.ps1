# Change le mot de passe de l'espace Prof-AS.
# Seule son empreinte (PBKDF2) est écrite dans js/config.js : le mot de passe lui-même n'est enregistré nulle part.
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

# Même calcul que dans js/prof.js : clé PBKDF2-SHA256 (sel aléatoire, 600 000 itérations), puis SHA-256 de la clé.
Write-Host "  Calcul de l'empreinte..."
$iterations = 600000
$sel = New-Object byte[] 16
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($sel)
$pbkdf2 = [Security.Cryptography.Rfc2898DeriveBytes]::new([Text.Encoding]::UTF8.GetBytes($clair), $sel, $iterations, [Security.Cryptography.HashAlgorithmName]::SHA256)
$cle = $pbkdf2.GetBytes(32)
$hex = { param($octets) ($octets | ForEach-Object { $_.ToString('x2') }) -join '' }
$controle = & $hex ([Security.Cryptography.SHA256]::Create().ComputeHash($cle))
$empreinte = 'pbkdf2:{0}:{1}:{2}' -f $iterations, (& $hex $sel), $controle

$texte = [IO.File]::ReadAllText($config, $utf8)
$texte = $texte -replace "motDePasseProf: '[^']*'", "motDePasseProf: '$empreinte'"
[IO.File]::WriteAllText($config, $texte, $utf8)
Write-Host "  Mot de passe changé. Envoie js/config.js sur GitHub pour qu'il s'applique au site en ligne." -ForegroundColor Green
