// Configuracion
const SUPABASE_URL = "https://udfwydpdxljgrtomutft.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BJ7L3dNV7tkiiZL1OE1ldw_bXzGpO5R";
let supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);

const formulario = document.querySelector("#formulario-producto");
const tituloFormulario = document.querySelector("#titulo-formulario");
const campoNombre = document.querySelector("#nombre");
const campoPrecio = document.querySelector("#precio");
const campoCantidad = document.querySelector("#cantidad");
const cuerpoTabla = document.querySelector("#lista-productos");
const estadoVacio = document.querySelector("#estado-vacio");
const mensaje = document.querySelector("#mensaje");
const botonRecargar = document.querySelector("#boton-recargar");
const botonAgregar = formulario.querySelector('button[type="submit"]');
const botonGuardar = document.querySelector("#boton-guardar");
const botonCancelar = document.querySelector("#boton-cancelar");
const totalProductos = document.querySelector("#total-productos");
const buscarProducto = document.querySelector("#buscar-producto");
const totalUnidades = document.querySelector("#total-unidades");
const valorInventario = document.querySelector("#valor-inventario");
const formularioVenta = document.querySelector("#formulario-venta");
const formularioLogin = document.querySelector("#formulario-login");
const correoLogin = document.querySelector("#correo-login");
const contrasenaLogin = document.querySelector("#contrasena-login");
const mensajeLogin = document.querySelector("#mensaje-login");
const seccionLogin = document.querySelector("#seccion-login");
const botonCerrarSesion = document.querySelector("#boton-cerrar-sesion");
const contenidoInventario = document.querySelector("#contenido-inventario");
const productoVenta = document.querySelector("#venta-producto");
const cantidadVenta = document.querySelector("#venta-cantidad");
const botonRegistroVenta = document.querySelector("#boton-registrar-venta");
const mensajeVenta = document.querySelector("#mensaje-venta");
const tablaVentas = document.querySelector("#tabla-ventas");
const estatusVentas = document.querySelector("#estatus-ventas");


// Guardar las filas  y el id que se este editando
let productosActuales = [];
let productosEnEdicionId = null;

// Esta herramienta convierte números al formato de moneda mexicana.
const formatoDinero = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

// Dar feedback mediante un mensaje
function mostrarMensaje(texto, tipo = "exito") {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}

// Actualizar estadisticas superiores
function actualizarEstadisticas(productos) {
  const unidades = productos.reduce(function (total, producto) {
    return total + producto.cantidad;
  }, 0);

  const valor = productos.reduce(function (total, producto) {
    return total + producto.precio * producto.cantidad;
  }, 0);

  totalProductos.textContent = productos.length;
  totalUnidades.textContent = unidades;
  valorInventario.textContent = formatoDinero.format(valor);
}

function mostrarProductos(productos) {
  cuerpoTabla.replaceChildren();

  productos.forEach(function (producto) {
    const fila = document.createElement("tr");
    const precio = Number(producto.precio || 0);
    const cantidad = Number(producto.cantidad || 0);

    const valores = [
      producto.nombre || "Sin nombre asignado",
      formatoDinero.format(precio),
      cantidad,
      formatoDinero.format(precio * cantidad),
    ];

    valores.forEach(function (valor) {
      const celda = document.createElement("td");
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    // Btn Eliminar
    const celdaAcccion = document.createElement("td");
    const acciones = document.createElement("div");
    acciones.className = "acciones-tabla";

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.className = "eliminar";
    botonEliminar.dataset.id = producto.id;
    botonEliminar.dataset.accion = "eliminar";
    botonEliminar.dataset.nombre = producto.nombre || "este producto";
    botonEliminar.textContent = "Eliminar";

    // Btn Editar
    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.className = "editar";
    botonEditar.dataset.accion = "editar";
    botonEditar.dataset.id = producto.id;
    botonEditar.textContent = "Editar";

    acciones.append(botonEditar, botonEliminar);
    celdaAcccion.appendChild(acciones);
    fila.appendChild(celdaAcccion);

    cuerpoTabla.appendChild(fila);
  });

  estadoVacio.hidden = productos.length !== 0;
  actualizarEstadisticas(productos);
}

function buscarProductos() {
  const texto = buscarProducto.value.toLowerCase().trim();

  const productosFiltrados = productosActuales.filter(function(producto) {
    return (producto.nombre || "").toLowerCase().includes(texto);
  });

  mostrarProductos(productosFiltrados);
}

function cargarProductosEnSelector(){
  productoVenta.replaceChildren();

  const opcionInicial=document.createElement("option");
  opcionInicial.value="";
  opcionInicial.textContent="Selecciona un producto";
  productoVenta.appendChild(opcionInicial);

  const productosDisponibles=productosActuales.filter(function (producto){
    return Number(producto.cantidad) > 0;

  });

  productosDisponibles.forEach(function (producto) {
    const opcion =document.createElement("option");

    opcion.value=producto.id;
    opcion.textContent= 
    producto.nombre + " - " + 
    formatoDinero.format(Number(producto.precio))+
    "(Existencias: " + producto.cantidad + ")";

    productoVenta.appendChild(opcion);
  });
}

async function obtenerProductos() {
  mostrarMensaje("Cargando productos...");

  const { data, error } = await supabaseClient
    .from("productos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error de Supabase:", error);
    mostrarMensaje("Error: " + error.message, "error");
    return false;
  }

  productosActuales = data;
  mostrarProductos(data);
  cargarProductosEnSelector();

  mostrarMensaje("Productos cargados correctamente.");
  return true;
}

async function obtenerVentas(){
  console.log("Se esta ejecutando obtenerVentas");

  const {data, error} = await supabaseClient
    .from("ventas")
    .select("cantidad, precio_unidad, total, fecha, productos(nombre)")
    .order("fecha", {ascending: false});

  if (error) {
    console.error("Error al cargar ventas:", error);
    estatusVentas.textContent = "Error al cargar las ventas.";
    return;
  }

  tablaVentas.replaceChildren();

  data.forEach(function(venta) {
    const fila = document.createElement("tr");

    const valores= [
      venta.productos?.nombre || "Sin nombre",
      venta.cantidad,
      formatoDinero.format(Number(venta.precio_unidad)),
      formatoDinero.format(Number(venta.total)),
      new Date(venta.fecha).toLocaleDateString("es-MX")
    ];

    valores.forEach(function (valor) {
      const celda = document.createElement("td");
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    tablaVentas.appendChild(fila);
  });

  estatusVentas.textContent = data.length
    ? "Historial de ventas actualizado correctamente"
    : "Sin ventas registradas";
}

async function registrarVenta(event){
  event.preventDefault();

  const idProducto= Number(productoVenta.value);
  const cantidad = Number(cantidadVenta.value);

  if(!productoVenta.value){
    mensajeVenta.textContent= "Selecciona un producto";
    return;
  }

  if(!Number.isInteger(cantidad) || cantidad <=0){
    mensajeVenta.textContent ="Ingresa una cantidad correcta";
    return;
  }

  botonRegistroVenta.disabled= true;
  mensajeVenta.textContent = "Registrando venta ";

  const {error}= await supabaseClient.rpc("registrar_venta", {
    p_producto_id: idProducto,
    p_cantidad: cantidad
  });

  if (error){
    console.error("Error al registrar la venta ");
    mensajeVenta.textContent= " No se completo el registro: " + error.message;
    botonRegistroVenta.disabled= false;
    return;
  }

  mensajeVenta.textContent= "Venta registrada de manera correcta";
  formularioVenta.reset();

  await obtenerProductos();
  await obtenerVentas();
  botonRegistroVenta.disabled= false;
}

async function iniciarSesion (event) {
  event.preventDefault();

  const correo = correoLogin.value.trim();
  const contrasena = contrasenaLogin.value;

  mensajeLogin.textContent = "Validando información...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: correo,
    password: contrasena
  });

  if (error) {
    mensajeLogin.textContent = "Correo o contraseña incorrectos";
    console.error("Error al iniciar sesión:", error);
    return;
  }

  mensajeLogin.textContent = "Inicio de sesión correcto";
  seccionLogin.hidden=true;
  contenidoInventario.hidden=false;

  await obtenerProductos();
  await obtenerVentas();
}

async function cerrarSesion() {
  const {error} =await supabaseClient.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión", error);
    return;
  }

  contenidoInventario.hidden =true;
  seccionLogin.hidden =false;

  formularioLogin.reset();
  mensajeLogin.textContent = "Sesión finalizada";
}

formularioVenta.addEventListener("submit", registrarVenta);
formularioLogin.addEventListener("submit", iniciarSesion);
botonCerrarSesion.addEventListener("click", cerrarSesion);

function leerProductoDelFormulario() {
  const nombre = campoNombre.value.trim();
  const precio = Number(campoPrecio.value);
  const cantidad = Number(campoCantidad.value);

  if (!nombre) {
    mostrarMensaje("Escribe el nombre del producto.", "error");
    campoNombre.focus();
    return;
  }

  if (campoPrecio.value === "" || !Number.isFinite(precio) || precio < 0) {
    mostrarMensaje(
      "El precio debe ser un numero mayor o igual a cero.",
      "error",
    );
    campoPrecio.focus();
    return;
  }

  if (
    campoCantidad.value === "" ||
    !Number.isInteger(cantidad) ||
    cantidad < 0
  ) {
    mostrarMensaje(
      "La cantidad debe de ser un entero mayor o igual a cero.",
      "error",
    );
    campoCantidad.focus();
    return;
  }
  return {
    nombre: nombre,
    precio: precio,
    cantidad: cantidad,
  };
}
async function insertarProducto(producto) {
  botonGuardar.disabled = true;
  mostrarMensaje("Guardando producto...");

  const { error } = await supabaseClient.from("productos").insert(producto);

  botonGuardar.disabled = false;

  if (error) {
    console.error("Error INSERT: ", error);
    mostrarMensaje("No se pudo guardar: " + error.message, "error");
    return;
  }

  restablecerFormulario();
  const recargado = await obtenerProductos();
  if (recargado) {
    mostrarMensaje("Producto agregado correctamente");
  }
  campoNombre.focus();
}

function iniciarEdicion(producto) {
  productosEnEdicionId = Number(producto.id);
  campoNombre.value = producto.nombre || "";
  campoPrecio.value = Number(producto.precio || 0);
  campoCantidad.value = Number(producto.cantidad || 0);

  tituloFormulario.textContent = "Editar Producto # " + producto.id;
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  mostrarMensaje("Editando " + (producto.nombre || "producto"));
  campoNombre.focus();
}

function restablecerFormulario() {
  productosEnEdicionId = null;
  formulario.reset();
  tituloFormulario.textContent = "Agregar producto";
  botonGuardar.textContent = "Agregar producto";
  botonGuardar.disabled = false;
  botonCancelar.hidden = true;
}

async function actualizarProducto(id, producto) {
  botonGuardar.disabled = true;
  mostrarMensaje("Actualizando producto...");

  const { error } = await supabaseClient
    .from("productos")
    .update(producto)
    .eq("id", id);

  botonGuardar.disabled = false;

  if (error) {
    console.error("error UPDATE:", error);
    mostrarMensaje("No se pudo actualizar: " + error.message, "error");
    return;
  }

  restablecerFormulario();
  const recargado = await obtenerProductos();
  if (recargado) {
    mostrarMensaje("Producto actualizado correctamente.");
  }
  campoNombre.focus();
}

async function procesarFormulario(evento) {
  evento.preventDefault();

  const producto = leerProductoDelFormulario();

  if (!producto) {
    return;
  }

  if (productosEnEdicionId === null) {
    await insertarProducto(producto);
  } else {
    await actualizarProducto(productosEnEdicionId, producto);
  }
}

async function eliminarProducto(id, nombre, boton) {
  const confirmar = window.confirm("¿Eliminar " + nombre + "?");

  if (!confirmar) {
    return;
  }

  boton.disabled = true;
  mostrarMensaje("Eliminando producto...");

  const { error } = await supabaseClient
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error DELETE:", error);
    boton.disabled = false;

    if (error.code === "23503"){
      mostrarMensaje(
        "No se puede borrar " + nombre +
        ", existen ventas asociadas a este registro",
        "error"
      );

    } else {
      mostrarMensaje(
        "No se pudo eliminar el producto. Intenta nuevamente",
        "error"
      );
    }

    return;
  }

  await obtenerProductos();
  mostrarMensaje("Producto eliminado correctamente");
}

formulario.addEventListener("submit", procesarFormulario);
botonRecargar.addEventListener("click", obtenerProductos);

botonCancelar.addEventListener("click", function () {
  restablecerFormulario();
  mostrarMensaje("Modo edicion cancelado.");
  campoNombre.focus();
});



cuerpoTabla.addEventListener("click", function (e) {
  const boton = e.target.closest("button[data-accion]");

  if (!boton || !cuerpoTabla.contains(boton)) {
    return;
  }

  const id = Number(boton.dataset.id);
  const producto = productosActuales.find(function (element) {
    return Number(element.id) === id;
  });

  if (!Number.isInteger(id) || !producto) {
    mostrarMensaje("El producto no tiene un id valido.", "error");
    return;
  }

  if (boton.dataset.accion === "editar") {
    iniciarEdicion(producto);
    return;
  }

  if (boton.dataset.accion === "eliminar") {
    eliminarProducto(id, producto.nombre || "ese producto", boton);
  }
});

buscarProducto.addEventListener("input", buscarProductos);

async function verificarSesion(){
  const {data, error}= await supabaseClient.auth.getSession();

  if (error){
    console.error("Error al comprobar el acceso", error);
    return;
  }

  if (data.session){
    seccionLogin.hidden= true;
    contenidoInventario.hidden= false;
    await obtenerProductos();
    await obtenerVentas();

  } else {
    seccionLogin.hidden=false;
    contenidoInventario.hidden=true;
  }
}

verificarSesion();