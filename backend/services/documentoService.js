const PizZip = require('pizzip');
const DocxTemplater = require('docxtemplater');
const fs = require('fs').promises;
const path = require('path');
const { getConnection, sql } = require('../config/database');

class DocumentoService {
    constructor() {
        this.templatePath = path.join(__dirname, '../../templates');
        this.outputPath = path.join(__dirname, '../../uploads/documentos');
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.templatePath, { recursive: true });
            await fs.mkdir(this.outputPath, { recursive: true });
            console.log('✅ Directorios de documentos asegurados');
        } catch (error) {
            console.error('Error creando directorios:', error);
        }
    }

    formatearFecha(fecha) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const fechaObj = new Date(fecha);
        return `${fechaObj.getDate()} de ${meses[fechaObj.getMonth()]} de ${fechaObj.getFullYear()}`;
    }

    formatearFechaNacimiento(fecha) {
        const meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        const fechaObj = new Date(fecha);
        return `${fechaObj.getDate()} de ${meses[fechaObj.getMonth()]} del ${fechaObj.getFullYear()}`;
    }

    async obtenerDocumentos() {
        try {
            console.log('📥 Obteniendo lista de documentos...');
            const documentos = [];
            
            try {
                await fs.access(this.outputPath);
            } catch {
                console.log('📁 Directorio de documentos no existe, creando...');
                await fs.mkdir(this.outputPath, { recursive: true });
                return [];
            }
            
            const files = await fs.readdir(this.outputPath);
            console.log(`📁 Archivos encontrados: ${files.length}`);
            
            for (const file of files) {
                if (file.endsWith('.docx') || file.endsWith('.pdf')) {
                    const filePath = path.join(this.outputPath, file);
                    try {
                        const stats = await fs.stat(filePath);
                        documentos.push({
                            nombre: file,
                            ruta: `/uploads/documentos/${file}`,
                            fecha: stats.birthtime,
                            tamaño: stats.size,
                            tipo: file.endsWith('.pdf') ? 'pdf' : 'docx'
                        });
                    } catch (statError) {
                        console.error(`Error obteniendo stats de ${file}:`, statError);
                    }
                }
            }
            
            return documentos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } catch (error) {
            console.error('❌ Error obteniendo documentos:', error);
            return [];
        }
    }

    async generarDocumentoAsignacion(data) {
        try {
            console.log('📄 Generando documento de asignación...');
            console.log('📦 Datos recibidos:', JSON.stringify(data, null, 2));

            if (!data.trabajador || !data.trabajador.nombre) {
                throw new Error('Faltan datos del trabajador');
            }
            if (!data.empresa || !data.empresa.nombre) {
                throw new Error('Faltan datos de la empresa');
            }

            // Buscar plantilla
            let templateFile = path.join(this.templatePath, 'Estructura.docx');
            
            try {
                await fs.access(templateFile);
                console.log('✅ Plantilla encontrada:', templateFile);
            } catch {
                console.log('⚠️ Plantilla no encontrada, creando una por defecto...');
                templateFile = await this.crearTemplatePorDefecto(templateFile);
            }
            
            const template = await fs.readFile(templateFile);
            const zip = new PizZip(template);
            const doc = new DocxTemplater(zip, {
                paragraphLoop: true,
                linebreaks: true
            });

            const fechaActual = this.formatearFecha(new Date());
            const fechaNacimiento = data.trabajador.fecha_nacimiento ? 
                this.formatearFechaNacimiento(data.trabajador.fecha_nacimiento) : 'No especificada';

            const trabajador = {
                nombre: data.trabajador.nombre || '',
                rut: data.trabajador.rut || '',
                nacionalidad: data.trabajador.nacionalidad || 'chilena',
                estado_civil: data.trabajador.estado_civil || 'No especificado',
                fecha_nacimiento: fechaNacimiento,
                domicilio: data.trabajador.domicilio || 'No especificado',
                comuna: data.trabajador.comuna || 'No especificada',
                ciudad: data.trabajador.ciudad || 'Santiago'
            };

            const empresa = {
                nombre: data.empresa.nombre || '',
                rut: data.empresa.rut || '',
                representante: data.empresa.representante || '',
                representante_rut: data.empresa.representante_rut || '',
                domicilio: data.empresa.domicilio || ''
            };

            const templateData = {
                fecha: fechaActual,
                empresa_nombre: empresa.nombre,
                empresa_rut: empresa.rut,
                empresa_representante: empresa.representante,
                empresa_representante_rut: empresa.representante_rut,
                empresa_domicilio: empresa.domicilio,
                trabajador_nombre: trabajador.nombre,
                trabajador_rut: trabajador.rut,
                trabajador_nacionalidad: trabajador.nacionalidad,
                trabajador_estado_civil: trabajador.estado_civil,
                trabajador_fecha_nacimiento: trabajador.fecha_nacimiento,
                trabajador_domicilio: trabajador.domicilio,
                trabajador_comuna: trabajador.comuna,
                trabajador_ciudad: trabajador.ciudad,
                equipos: this.construirListadoEquipos(data.equipos || [])
            };

            console.log('📝 Datos para plantilla:', templateData);
            doc.render(templateData);

            const timestamp = Date.now();
            const nombreLimpio = trabajador.nombre.replace(/[^a-zA-Z0-9]/g, '_');
            const rutLimpio = trabajador.rut.replace(/[^0-9kK]/g, '');
            const nombreBase = `${nombreLimpio}_${rutLimpio || 'sinrut'}`;
            const docxPath = path.join(this.outputPath, `${nombreBase}_${timestamp}.docx`);

            const buffer = doc.getZip().generate({ type: 'nodebuffer' });
            await fs.writeFile(docxPath, buffer);
            console.log(`✅ DOCX generado: ${docxPath}`);

            if (data.firma) {
                const firmaPath = path.join(this.outputPath, `firma_${timestamp}.png`);
                await fs.writeFile(firmaPath, Buffer.from(data.firma));
                console.log(`✅ Firma guardada: ${firmaPath}`);
            }

            let documentoId = null;
            if (data.uso_producto_id) {
                documentoId = await this.registrarDocumento({
                    uso_producto_id: data.uso_producto_id,
                    nombre_documento: path.basename(docxPath),
                    ruta_documento: `/uploads/documentos/${path.basename(docxPath)}`,
                    tipo_documento: 'ASIGNACION'
                });
            }

            const resultado = {
                id: documentoId,
                docx: `/uploads/documentos/${path.basename(docxPath)}`,
                nombre: path.basename(docxPath),
                fecha: new Date()
            };

            console.log('✅ Documento generado:', resultado);
            return resultado;

        } catch (error) {
            console.error('❌ Error generando documento:', error);
            throw error;
        }
    }

    construirListadoEquipos(equipos) {
        if (!equipos || equipos.length === 0) return 'Sin equipos asignados.';
        let texto = '';
        equipos.forEach((equipo, index) => {
            texto += `${index + 1}. ${equipo.tipo || 'Equipo'}: `;
            texto += `Marca ${equipo.marca || 'N/A'}, `;
            texto += `Modelo ${equipo.modelo || 'N/A'}, `;
            texto += `Serie N° ${equipo.serie || 'N/A'}, `;
            texto += `en estado ${equipo.estado || 'Bueno'}`;
            if (equipo.observaciones) texto += `. ${equipo.observaciones}`;
            texto += '.\n';
        });
        return texto;
    }

    async crearTemplatePorDefecto(templatePath) {
        const contenido = `ACTA DE ASIGNACIÓN DE EQUIPOS

En Santiago, a {{fecha}}, comparecen:

Por una parte, {{empresa_nombre}}, RUT {{empresa_rut}}, representada por {{empresa_representante}}, RUT {{empresa_representante_rut}}, ambos domiciliados en {{empresa_domicilio}}.

Por otra parte, {{trabajador_nombre}}, RUT {{trabajador_rut}}, de nacionalidad {{trabajador_nacionalidad}}, estado civil {{trabajador_estado_civil}}, nacido el {{trabajador_fecha_nacimiento}}, domiciliado en {{trabajador_domicilio}}, comuna de {{trabajador_comuna}}.

Se ha acordado la siguiente asignación de equipos:

{{equipos}}

Firmas:

____________________          ____________________
El Empleado                    La Empresa`;

        await fs.writeFile(templatePath, contenido);
        console.log(`✅ Plantilla creada: ${templatePath}`);
        return templatePath;
    }

    async registrarDocumento(data) {
        try {
            const pool = await getConnection();
            
            const tableCheck = await pool.request()
                .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'INV' AND TABLE_NAME = 'documentos_generados'`);
            
            if (tableCheck.recordset[0].count === 0) {
                await pool.request()
                    .query(`CREATE TABLE INV.documentos_generados (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        uso_producto_id INT NULL,
                        nombre_documento NVARCHAR(255) NOT NULL,
                        ruta_documento NVARCHAR(500) NOT NULL,
                        fecha_generacion DATETIME DEFAULT GETDATE(),
                        estado NVARCHAR(50) DEFAULT 'generado',
                        tipo_documento NVARCHAR(50) DEFAULT 'ASIGNACION',
                        FOREIGN KEY (uso_producto_id) REFERENCES INV.producto_uso(id)
                    )`);
                console.log('✅ Tabla documentos_generados creada');
            }
            
            const result = await pool.request()
                .input('uso_producto_id', sql.Int, data.uso_producto_id)
                .input('nombre_documento', sql.NVarChar, data.nombre_documento)
                .input('ruta_documento', sql.NVarChar, data.ruta_documento)
                .input('fecha_generacion', sql.DateTime, new Date())
                .input('estado', sql.NVarChar, data.estado || 'generado')
                .input('tipo_documento', sql.NVarChar, data.tipo_documento || 'ASIGNACION')
                .query(`
                    INSERT INTO INV.documentos_generados 
                    (uso_producto_id, nombre_documento, ruta_documento, fecha_generacion, estado, tipo_documento)
                    OUTPUT INSERTED.id
                    VALUES 
                    (@uso_producto_id, @nombre_documento, @ruta_documento, @fecha_generacion, @estado, @tipo_documento)
                `);

            return result.recordset[0]?.id;
        } catch (error) {
            console.error('❌ Error registrando documento:', error);
            return null;
        }
    }

    async eliminarDocumento(nombreArchivo) {
        try {
            const filePath = path.join(this.outputPath, nombreArchivo);
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log(`✅ Archivo eliminado: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ Error eliminando documento:', error);
            return false;
        }
    }
}

module.exports = new DocumentoService();