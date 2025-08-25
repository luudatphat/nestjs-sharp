import { removeBackground } from "@imgly/background-removal";

const $ = (q) => document.querySelector(q);
const msgBox = $("#messages");
const drop = $("#drop");
const file = $("#file");
const runBtn = $("#run");
const loading = $("#loading");
const fill = $("#fill");
const fmtSel = $("#fmt");
const qSlider = $("#q");
const qVal = $("#qv");
const modelSel = $("#model");
const orig = $("#orig");
const out = $("#out");
const result = $("#result");
const downloadBtn = $("#download");

let selectedFile = null;
let processedBlob = null;

function showMsg(text, ok = true) {
  msgBox.innerHTML = "";
  const div = document.createElement("div");
  div.className = `msg ${ok ? "ok" : "err"}`;
  div.textContent = text;
  msgBox.appendChild(div);
}

function pickFile() {
  file.click();
}

drop.addEventListener("click", pickFile);
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("dragover");
});
drop.addEventListener("dragleave", (e) => {
  e.preventDefault();
  drop.classList.remove("dragover");
});
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("dragover");
  const f = e.dataTransfer?.files?.[0];
  if (f) handleFile(f);
});
file.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) handleFile(f);
});

function handleFile(f) {
  if (!f.type.startsWith("image/")) return showMsg("Please select an image.", false);
  if (f.size > 10 * 1024 * 1024) return showMsg("Max size is 10MB.", false);
  selectedFile = f;
  const r = new FileReader();
  r.onload = (e) => (orig.src = e.target.result);
  r.readAsDataURL(f);
  runBtn.disabled = false;
  result.style.display = "none";
  processedBlob = null;
  showMsg("Image loaded. Ready to process.", true);
}

qSlider.addEventListener("input", () => (qVal.textContent = qSlider.value));

runBtn.addEventListener("click", async () => {
  if (!selectedFile) return showMsg("Please select an image.", false);

  // hiển thị loading
  loading.style.display = "block";
  runBtn.disabled = true;
  fill.style.width = "0%";
  msgBox.innerHTML = "";

  // cấu hình
  const format = fmtSel.value; // image/png | image/jpeg | image/webp
  const model = modelSel.value; // small | medium | large
  const output = { format };
  if (format === "image/jpeg" || format === "image/webp") {
    output.quality = parseFloat(qSlider.value);
  }

  // fake progress (một số bản có callback progress, nhưng không phải lúc nào cũng có)
  let fake = 0;
  const timer = setInterval(() => {
    fake = Math.min(fake + Math.random() * 12, 90);
    fill.style.width = fake + "%";
  }, 180);

  try {
    const blob = await removeBackground(selectedFile, {
      model,
      output,
      // Nếu bản lib hiện tại expose progress: bật callback này
      // progress: (p) => { fill.style.width = Math.round(p * 100) + '%' }
    });

    clearInterval(timer);
    fill.style.width = "100%";
    processedBlob = blob;
    out.src = URL.createObjectURL(blob);

    setTimeout(() => {
      loading.style.display = "none";
      runBtn.disabled = false;
      result.style.display = "block";
      showMsg("Done!", true);
    }, 300);
  } catch (err) {
    clearInterval(timer);
    loading.style.display = "none";
    runBtn.disabled = false;
    showMsg("Error: " + (err?.message || String(err)), false);
    console.error(err);
  }
});

downloadBtn.addEventListener("click", () => {
  if (!processedBlob) return showMsg("No processed image.", false);
  const ext =
    fmtSel.value === "image/png" ? "png" : fmtSel.value === "image/webp" ? "webp" : "jpg";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(processedBlob);
  a.download = `bg-removed-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
});