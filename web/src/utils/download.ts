export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";

  document.body.appendChild(link);
  link.click();
  link.remove();

  // 让浏览器有机会开始下载后再释放 URL
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
