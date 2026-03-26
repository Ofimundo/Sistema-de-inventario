import React, { useState } from 'react';
import {
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Card,
    CardContent,
    Typography,
    Autocomplete
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import asignacionService from '../../services/asignacionService';

const validationSchema = Yup.object({
    producto_id: Yup.number().required('Debe seleccionar un producto'),
    nombre_usuario: Yup.string().required('El nombre del usuario es requerido'),
    email: Yup.string()
        .email('Email inválido')
        .required('El email es requerido'),
    departamento: Yup.string().required('El departamento es requerido'),
    cantidad: Yup.number()
        .min(1, 'La cantidad debe ser al menos 1')
        .required('La cantidad es requerida'),
    motivo: Yup.string().required('El motivo es requerido')
});

export default function AsignarProducto({ productos, loading, onSuccess, onError }) {
    const [submitting, setSubmitting] = useState(false);

    const formik = useFormik({
        initialValues: {
            producto_id: '',
            nombre_usuario: '',
            email: '',
            departamento: '',
            cantidad: 1,
            motivo: '',
            comentario: ''
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                setSubmitting(true);
                await asignacionService.asignarProducto(values);
                formik.resetForm();
                onSuccess();
            } catch (error) {
                onError(error.message || 'Error al asignar producto');
            } finally {
                setSubmitting(false);
            }
        }
    });

    return (
        <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Asignar Producto a Usuario
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={formik.touched.producto_id && Boolean(formik.errors.producto_id)}>
                        <Autocomplete
                            options={productos}
                            loading={loading}
                            getOptionLabel={(option) => 
                                `${option.nombre} - ${option.marca} ${option.modelo} (Stock: ${option.stock})`
                            }
                            onChange={(event, value) => {
                                formik.setFieldValue('producto_id', value?.id || '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Seleccionar Producto"
                                    error={formik.touched.producto_id && Boolean(formik.errors.producto_id)}
                                    helperText={formik.touched.producto_id && formik.errors.producto_id}
                                />
                            )}
                        />
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="number"
                        name="cantidad"
                        label="Cantidad"
                        value={formik.values.cantidad}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.cantidad && Boolean(formik.errors.cantidad)}
                        helperText={formik.touched.cantidad && formik.errors.cantidad}
                        inputProps={{ min: 1 }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="nombre_usuario"
                        label="Nombre Completo del Usuario"
                        value={formik.values.nombre_usuario}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.nombre_usuario && Boolean(formik.errors.nombre_usuario)}
                        helperText={formik.touched.nombre_usuario && formik.errors.nombre_usuario}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="email"
                        label="Email del Usuario"
                        type="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="departamento"
                        label="Departamento/Área"
                        value={formik.values.departamento}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.departamento && Boolean(formik.errors.departamento)}
                        helperText={formik.touched.departamento && formik.errors.departamento}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Motivo de Asignación</InputLabel>
                        <Select
                            name="motivo"
                            value={formik.values.motivo}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.motivo && Boolean(formik.errors.motivo)}
                        >
                            <MenuItem value="Asignación de equipo">Asignación de equipo</MenuItem>
                            <MenuItem value="Reemplazo">Reemplazo</MenuItem>
                            <MenuItem value="Nuevo ingreso">Nuevo ingreso</MenuItem>
                            <MenuItem value="Préstamo temporal">Préstamo temporal</MenuItem>
                            <MenuItem value="Otro">Otro</MenuItem>
                        </Select>
                        {formik.touched.motivo && formik.errors.motivo && (
                            <FormHelperText error>{formik.errors.motivo}</FormHelperText>
                        )}
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        name="comentario"
                        label="Comentarios adicionales"
                        value={formik.values.comentario}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<SaveIcon />}
                        disabled={submitting || !formik.isValid}
                        sx={{ mt: 2 }}
                    >
                        {submitting ? 'Asignando...' : 'Asignar Producto'}
                    </Button>
                </Grid>
                // Agregar estos campos al formulario
<Grid item xs={12} md={6}>
    <TextField
        fullWidth
        name="trabajador_rut"
        label="RUT del Trabajador"
        value={formik.values.trabajador_rut}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.trabajador_rut && Boolean(formik.errors.trabajador_rut)}
        helperText={formik.touched.trabajador_rut && formik.errors.trabajador_rut}
    />
</Grid>

<Grid item xs={12} md={6}>
    <FormControl fullWidth>
        <InputLabel>Nacionalidad</InputLabel>
        <Select
            name="trabajador_nacionalidad"
            value={formik.values.trabajador_nacionalidad}
            onChange={formik.handleChange}
        >
            <MenuItem value="chilena">Chilena</MenuItem>
            <MenuItem value="argentina">Argentina</MenuItem>
            <MenuItem value="peruana">Peruana</MenuItem>
            <MenuItem value="colombiana">Colombiana</MenuItem>
            <MenuItem value="venezolana">Venezolana</MenuItem>
            <MenuItem value="otra">Otra</MenuItem>
        </Select>
    </FormControl>
</Grid>

<Grid item xs={12} md={6}>
    <FormControl fullWidth>
        <InputLabel>Estado Civil</InputLabel>
        <Select
            name="trabajador_estado_civil"
            value={formik.values.trabajador_estado_civil}
            onChange={formik.handleChange}
        >
            <MenuItem value="soltero">Soltero/a</MenuItem>
            <MenuItem value="casado">Casado/a</MenuItem>
            <MenuItem value="divorciado">Divorciado/a</MenuItem>
            <MenuItem value="viudo">Viudo/a</MenuItem>
            <MenuItem value="conviviente">Conviviente Civil</MenuItem>
        </Select>
    </FormControl>
</Grid>

<Grid item xs={12} md={6}>
    <TextField
        fullWidth
        type="date"
        name="trabajador_fecha_nacimiento"
        label="Fecha de Nacimiento"
        value={formik.values.trabajador_fecha_nacimiento}
        onChange={formik.handleChange}
        InputLabelProps={{ shrink: true }}
    />
</Grid>

<Grid item xs={12}>
    <TextField
        fullWidth
        name="trabajador_domicilio"
        label="Domicilio del Trabajador"
        value={formik.values.trabajador_domicilio}
        onChange={formik.handleChange}
    />
</Grid>

<Grid item xs={12} md={6}>
    <TextField
        fullWidth
        name="trabajador_comuna"
        label="Comuna"
        value={formik.values.trabajador_comuna}
        onChange={formik.handleChange}
    />
</Grid>

// Después de la asignación exitosa, mostrar enlaces de descarga
{resultado?.documentos && (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
        <Typography variant="h6">✅ Documentos generados:</Typography>
        <Button
            startIcon={<FileDownloadIcon />}
            onClick={() => descargarDocumento(resultado.documentos.docx)}
            sx={{ mr: 1 }}
        >
            Descargar DOCX
        </Button>
        {resultado.documentos.pdf && (
            <Button
                startIcon={<PictureAsPdfIcon />}
                onClick={() => descargarDocumento(resultado.documentos.pdf)}
                color="error"
            >
                Descargar PDF
            </Button>
        )}
    </Box>
)}
            </Grid>
        </form>
    );
}