param (
    [string]$docxPath,
    [string]$pdfPath
)

$ErrorActionPreference = "Stop"

try {
    Write-Host "Opening Word application..."
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false

    Write-Host "Opening document: $docxPath"
    $doc = $word.Documents.Open($docxPath)

    Write-Host "Saving as PDF: $pdfPath"
    $doc.SaveAs($pdfPath, 17) # 17 = wdFormatPDF

    Write-Host "Closing document..."
    $doc.Close()

    Write-Host "Quitting Word..."
    $word.Quit()

    # Clean up COM objects
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()

    Write-Host "SUCCESS"
}
catch {
    Write-Host "ERROR: $_"
    if ($word) {
        try {
            $word.Quit()
        } catch {}
    }
    exit 1
}
