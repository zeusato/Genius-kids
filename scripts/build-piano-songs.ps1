$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$sourceRoot = Join-Path $repoRoot 'games/Piano/content/sources'
$manifest = Get-Content (Join-Path $sourceRoot 'manifest.json') -Raw | ConvertFrom-Json
$catalog = @(
  @('25432-hotcrossbuns', 'Bánh thơm mới ra lò', 'bakery', '10–11'),
  @('25432-londonbridge', 'Cây cầu London', 'bridge', '42'),
  @('25432-polly', 'Polly đun ấm trà', 'tea', '9'),
  @('25432-avignon', 'Nhảy múa trên cầu', 'bridge', '40–41'),
  @('25432-lucylocket', 'Chiếc túi của Lucy', 'flower', '25'),
  @('25432-schlaf', 'Ngủ ngoan bé nhỏ', 'moon', '21'),
  @('25432-aikendrum', 'Bạn nhạc công vui vẻ', 'drum', '38'),
  @('25432-margerydaw', 'Bập bênh vui vẻ', 'garden', '55'),
  @('25432-threelittlekittens', 'Ba chú mèo con', 'cat', '46'),
  @('25432-looby', 'Cùng múa vòng tròn', 'garden', '54'),
  @('25418-girls', 'Các bạn ra chơi', 'garden', '9'),
  @('25418-mulberry', 'Vòng quanh cây dâu', 'garden', '10–11'),
  @('25418-oranges', 'Cam vàng chanh xanh', 'flower', '12'),
  @('25418-lavender', 'Sắc hoa oải hương', 'flower', '17'),
  @('25418-threeships', 'Ba chiếc thuyền nhỏ', 'boat', '18–19'),
  @('25418-dingdong', 'Chuông ngân ding dong', 'bell', '20'),
  @('25418-threeblindmice', 'Giai điệu ba chú chuột', 'cat', '22'),
  @('25418-dickory', 'Chú chuột và đồng hồ', 'clock', '23'),
  @('25418-sixpence', 'Bài ca sáu xu', 'bird', '35'),
  @('25418-bopeep', 'Cô bé và đàn cừu', 'sheep', '36–37'),
  @('25418-baabaa', 'Chú cừu đen', 'sheep', '38'),
  @('25418-jackandjill', 'Jack và Jill', 'garden', '52–53'),
  @('25418-hushaby', 'Khúc ru bé ngủ', 'moon', '55'),
  @('25418-kingcole', 'Nhà vua yêu âm nhạc', 'crown', '56')
)
$stepMap = @{C=0; D=2; E=4; F=5; G=7; A=9; B=11}
$songs = @()
foreach ($item in $catalog) {
  $xml = New-Object System.Xml.XmlDocument
  $xml.XmlResolver = $null
  $xml.Load((Join-Path $sourceRoot ($item[0] + '.xml')))
  $part = $xml.SelectSingleNode('/score-partwise/part')
  $divisions = 1; $fifths = 0; $meter = '4/4'; $skipping = $false
  $events = [System.Collections.Generic.List[object]]::new()
  $beat = 0.0
  foreach ($measure in $part.SelectNodes('measure')) {
    $attr = $measure.SelectSingleNode('attributes')
    if ($attr) {
      if ($attr.divisions) { $divisions = [double]$attr.divisions }
      if ($attr.key) { $fifths = [int]$attr.key.fifths }
      if ($attr.time) { $meter = "$($attr.time.beats)/$($attr.time.'beat-type')" }
    }
    $ending = $measure.SelectSingleNode('barline/ending[@type="start"]')
    if ($ending) { $skipping = $ending.number -eq '1' }
    if (!$skipping) {
      foreach ($note in $measure.SelectNodes('note')) {
        if (($note.voice -and $note.voice -ne '1') -or ($note.staff -and $note.staff -ne '1') -or $note.SelectSingleNode('grace')) { continue }
        $duration = [double]$note.duration / $divisions
        if ($duration -le 0) { continue }
        $midi = $null
        if ($note.pitch) { $midi = 12 * (1 + [int]$note.pitch.octave) + $stepMap[[string]$note.pitch.step] + [int]$note.pitch.alter }
        if ($note.SelectSingleNode('chord')) {
          if ($events.Count -gt 0 -and $null -ne $midi -and $midi -gt $events[$events.Count - 1].midi) { $events[$events.Count - 1].midi = $midi }
          continue
        }
        $last = if ($events.Count) { $events[$events.Count - 1] } else { $null }
        if ($note.SelectSingleNode('tie[@type="stop"]') -and $last -and $last.midi -eq $midi) { $last.beats += $duration }
        else { $events.Add(@{midi=$midi; at=$beat; beats=$duration}) }
        $beat += $duration
      }
    }
    if ($measure.SelectSingleNode('barline/ending[@type="stop" or @type="discontinue"]')) { $skipping = $false }
  }
  # Transpose the key signature to C, preserving every interval and duration.
  $shift = -((($fifths * 7) % 12 + 12) % 12)
  $pitches = @($events | Where-Object { $null -ne $_.midi } | ForEach-Object { $_.midi + $shift })
  $min = ($pitches | Measure-Object -Minimum).Minimum
  $max = ($pitches | Measure-Object -Maximum).Maximum
  while ($min -lt 60) { $shift += 12; $min += 12; $max += 12 }
  while ($max -gt 84 -and $min -ge 72) { $shift -= 12; $min -= 12; $max -= 12 }
  if ($max -gt 84) { throw "Out of range: $($item[0])" }
  foreach ($event in $events) { if ($null -ne $event.midi) { $event.midi += $shift } }
  $source = $manifest | Where-Object { $_.file -eq ($item[0] + '.xml') } | Select-Object -First 1
  $noteCount = @($events | Where-Object { $null -ne $_.midi }).Count
  $level = if ($noteCount -le 40 -and $max-$min -le 9) { 'easy' } elseif ($noteCount -le 80) { 'medium' } else { 'hard' }
  $songs += @{
    id=$item[0]; melodyFamilyId=$item[0]; title=$item[1]; originalTitle=[string]$xml.'score-partwise'.'movement-title'; art=$item[2]
    bpm=84; meter=$meter; level=$level; notes=@($events); totalBeats=$beat
    source=@{ url=$source.source; book=$source.book; page=$item[3]; sha256=$source.sha256; transpose=$shift }
  }
  Write-Output "$($item[0]): $noteCount notes, MIDI $min-$max, $beat beats, $level"
}
$output = Join-Path $repoRoot 'games/Piano/content/songs.generated.json'
$songs | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $output -Encoding utf8
