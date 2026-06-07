const SUPABASE_URL = "https://htfdnisdbpcubsllfyxa.supabase.co";
const SUPABASE_KEY = "sb_publishable_DXDgp0rhvyYw_gF8mdcIVg_QW1dJ9Jo";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const lista = document.getElementById("lista");
const alerta = document.getElementById("alerta");
const buscador = document.getElementById("buscador");

let productos = [];

async function cargarProductos() {
    const { data, error } = await supabaseClient
        .from("stock")
        .select("*")
        .order("id");

    if(error){
        console.error(error);
        return;
    }

    productos = data;
    render();
}

async function agregarProducto() {

    const nombre = document.getElementById("nombre").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const cantidad = parseInt(document.getElementById("cantidad").value);

    if(!nombre || !categoria || isNaN(cantidad)) return;

    await supabaseClient
        .from("stock")
        .insert([
            {
                nombre,
                categoria,
                cantidad
            }
        ]);

    document.getElementById("nombre").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("cantidad").value = "";

    cargarProductos();
}

async function eliminar(id){
    await supabaseClient
        .from("stock")
        .delete()
        .eq("id", id);

    cargarProductos();
}

async function modificar(id, cantidad){
    await supabaseClient
        .from("stock")
        .update({cantidad})
        .eq("id", id);

    cargarProductos();
}

function render(){

    const filtro = buscador.value.toLowerCase();

    lista.innerHTML = "";

    let bajos = [];

    productos
    .filter(p =>
        p.nombre.toLowerCase().includes(filtro) ||
        p.categoria.toLowerCase().includes(filtro)
    )
    .forEach(p => {

        if(p.cantidad <= 5){
            bajos.push(p.nombre);
        }

        lista.innerHTML += `
        <div class="producto">

            <div class="info">
                <strong>${p.nombre}</strong><br>
                Categoría: ${p.categoria}<br>
                Stock: ${p.cantidad}
            </div>

            <div class="acciones">
                <button onclick="sumar(${p.id},${p.cantidad})">➕</button>
                <button onclick="restar(${p.id},${p.cantidad})">➖</button>
                <button onclick="eliminar(${p.id})">❌</button>
            </div>

        </div>
        `;
    });

    if(bajos.length){
        alerta.classList.remove("oculto");
        alerta.innerHTML =
        "⚠ Stock bajo: " + bajos.join(", ");
    }else{
        alerta.classList.add("oculto");
    }
}

window.sumar = (id,cantidad) =>
    modificar(id,cantidad+1);

window.restar = (id,cantidad) =>
    modificar(id,Math.max(0,cantidad-1));

window.eliminar = eliminar;

document
.getElementById("agregarBtn")
.addEventListener("click", agregarProducto);

buscador.addEventListener("input", render);

cargarProductos();

window.exportarExcel = function(){
    const ws = XLSX.utils.json_to_sheet(productos);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Stock"
    );

    XLSX.writeFile(wb,"stock.xlsx");
};

window.exportarWord = function(){

    let contenido = `
    <html>
    <body>
    <h2>Stock</h2>
    <table border="1">
    <tr>
        <th>Producto</th>
        <th>Categoría</th>
        <th>Cantidad</th>
    </tr>
    `;

    productos.forEach(p=>{
        contenido += `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>${p.cantidad}</td>
        </tr>
        `;
    });

    contenido += `
    </table>
    </body>
    </html>
    `;

    const blob = new Blob(
        [contenido],
        {type:"application/msword"}
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "stock.doc";

    a.click();
};
