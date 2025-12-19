const ADMIN_PASS = "1234";
let datos = {};

function loginAdmin() {
  if (prompt("Contraseña admin") === ADMIN_PASS) {
    document.body.classList.add("admin");
  }
}

document.querySelectorAll("input").forEach(i => {
  if (i.id) {
    i.value = localStorage.getItem(i.id) || i.value;
    i.onchange = () => localStorage.setItem(i.id, i.value);
  }
});

function descuentoPorVolumen(paginas) {
  if (paginas >= 100) return +vol100.value;
  if (paginas >= 30) return +vol30.value;
  if (paginas >= 10) return +vol10.value;
  return 0;
}

function analizarCanvas(canvas) {
  const data = canvas.getContext("2d")
    .getImageData(0,0,canvas.width,canvas.height).data;

  let bn=0,color=0,total=0;
  for (let i=0;i<data.length;i+=4) {
    const r=data[i],g=data[i+1],b=data[i+2];
    if (r<250||g<250||b<250) {
      total++;
      if (r<40&&g<40&&b<40) bn++;
      else color++;
    }
  }
  return {bn: bn/total, color: color/total};
}

async function procesarArchivo() {
  const file = fileInput.files[0];
  if (!file) return alert("Selecciona un archivo");
  preview.innerHTML = "";
  if (file.type === "application/pdf") procesarPDF(file);
  else procesarImagen(file);
}

async function procesarPDF(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let bn=0,color=0;

  for (let i=1;i<=pdf.numPages;i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({scale:1});
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport
    }).promise;
    preview.appendChild(canvas);
    const t = analizarCanvas(canvas);
    bn+=t.bn; color+=t.color;
  }
  calcular(pdf.numPages, bn/pdf.numPages, color/pdf.numPages);
}

function procesarImagen(file) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img,0,0);
    preview.appendChild(canvas);
    const t = analizarCanvas(canvas);
    calcular(1,t.bn,t.color);
  };
  img.src = URL.createObjectURL(file);
}

function calcular(paginas,bn,color) {
  let total = paginas * precioBN.value * bn;
  if (!soloBN.checked)
    total += paginas * precioColor.value * color;

  if (dobleCara.checked) total *= 0.9;

  const dVol = descuentoPorVolumen(paginas);
  total -= total * (dVol/100);
  total -= total * (+descuento.value/100);

  datos={paginas,bn,color,total};

  resultado.innerHTML = `
    Páginas: ${paginas}<br>
    Descuento volumen: ${dVol}%<br>
    B/N: ${(bn*100).toFixed(1)}%<br>
    Color: ${(color*100).toFixed(1)}%<br>
    <strong>Total: $${total.toFixed(2)}</strong>
  `;
}

function imprimirTicket() {
  ticket.innerHTML = `
    <h3>CIBER PRINT</h3>
    ${new Date().toLocaleString()}<br>
    Páginas: ${datos.paginas}<br>
    Total: $${datos.total.toFixed(2)}
  `;
  window.print();
}
