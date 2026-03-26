import React, { useState } from 'react';
import {
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Autocomplete,
    Box,
    Paper,
    Alert
} from '@mui/material';
import { Save as SaveIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import asignacionService from '../../services/asignacionService';

const validationSchema = Yup.object({
    producto_id: Yup.number().required('Debe seleccionar un producto'),
    motivo_baja: Yup.string().required('El motivo de baja es requerido'),
    autorizado_por: Yup.string().required('El autorizante es requerido'),
    fecha_baja: Yup.date().required('La fecha de baja es requerida')
});

export default function BajaProducto({ productos, loading, onSuccess, onError }) {
    const [submitting, setSubmitting] = useState(false);
    const [archivo, setArchivo] = useState(null);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const formik = useFormik({
        initialValues: {
            producto_id: '',
            motivo_baja: '',
            autorizado_por: '',
            fecha_baja: new Date().toISOString().split('T')[0],
            observaciones: ''
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                setSubmitting(true);
                
                // Crear FormData para enviar archivo
                const formData = new FormData();
                Object.keys(values).forEach(key => {
                    formData.append(key, values[key]);
                });
                
                if (archivo) {
                    formData.append('documento', archivo);
                }

                const resultado = await asignacionService.registrarBaja(formData);
                
                if (resultado.success) {
                    formik.resetForm();
                    setArchivo(null);
                    setProductoSeleccionado(null);
                    onSuccess('Baja registrada exitosamente');
                } else {
                    onError(resultado.message || 'Error al registrar baja');
                }
            } catch (error) {
                onError(error.message || 'Error al conectar con el servidor');
            } finally {
                setSubmitting(false);
            }
        }
    });

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setArchivo(file);
        }
    };

    const motivosBaja = [
        'Deterioro por uso',
        'Obsoleto',
        'Daño irreparable',
        'Robo/Extravío',
        'Donación',
        'Venta',
        'Otro'
    ];

    return (
        <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                        Dar de Baja Producto
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                        Registra la baja definitiva de un producto del inventario
                    </Typography>
                </Grid>

                {/* Selector de Producto */}
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <Autocomplete
                            options={productos}
                            loading={loading}
                            getOptionLabel={(option) => 
                                `${option.nombre} - ${option.marca || ''} ${option.modelo || ''} (Stock: ${option.stock})`
                            }
                            value={productoSeleccionado}
                            onChange={(event, newValue) => {
                                setProductoSeleccionado(newValue);
                                formik.setFieldValue('producto_id', newValue?.id || '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Seleccionar Producto a dar de Baja"
                                    error={formik.touched.producto_id && Boolean(formik.errors.producto_id)}
                                    helperText={formik.touched.producto_id && formik.errors.producto_id}
                                />
                            )}
                        />
                    </FormControl>
                </Grid>

                {/* Información del producto seleccionado */}
                {productoSeleccionado && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Producto seleccionado:
                            </Typography>
                            <Typography variant="body2">
                                <strong>{productoSeleccionado.nombre}</strong> - 
                                Marca: {productoSeleccionado.marca || 'N/A'} | 
                                Modelo: {productoSeleccionado.modelo || 'N/A'} | 
                                Stock: {productoSeleccionado.stock}
                            </Typography>
                        </Paper>
                    </Grid>
                )}

                {/* Motivo de Baja */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Motivo de Baja *</InputLabel>
                        <Select
                            name="motivo_baja"
                            value={formik.values.motivo_baja}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.motivo_baja && Boolean(formik.errors.motivo_baja)}
                            label="Motivo de Baja *"
                        >
                            {motivosBaja.map((motivo) => (
                                <MenuItem key={motivo} value={motivo}>
                                    {motivo}
                                </MenuItem>
                            ))}
                        </Select>
                        {formik.touched.motivo_baja && formik.errors.motivo_baja && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                {formik.errors.motivo_baja}
                            </Alert>
                        )}
                    </FormControl>
                </Grid>

                {/* Autorizado por */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="autorizado_por"
                        label="Autorizado por *"
                        value={formik.values.autorizado_por}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.autorizado_por && Boolean(formik.errors.autorizado_por)}
                        helperText={formik.touched.autorizado_por && formik.errors.autorizado_por}
                        placeholder="Nombre de quien autoriza"
                    />
                </Grid>

                {/* Fecha de Baja */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="date"
                        name="fecha_baja"
                        label="Fecha de Baja *"
                        value={formik.values.fecha_baja}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ shrink: true }}
                        error={formik.touched.fecha_baja && Boolean(formik.errors.fecha_baja)}
                        helperText={formik.touched.fecha_baja && formik.errors.fecha_baja}
                    />
                </Grid>

                {/* Documento de Autorización */}
                <Grid item xs={12}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        color={archivo ? 'success' : 'primary'}
                        sx={{ mb: 1 }}
                    >
                        {archivo ? 'Documento seleccionado' : 'Subir documento de autorización'}
                        <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                    </Button>
                    {archivo && (
                        <Box sx={{ mt: 1 }}>
                            <Alert severity="info" icon={false}>
                                📄 {archivo.name} ({(archivo.size / 1024).toFixed(2)} KB)
                            </Alert>
                        </Box>
                    )}
                </Grid>

                {/* Observaciones */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        name="observaciones"
                        label="Observaciones"
                        value={formik.values.observaciones}
                        onChange={formik.handleChange}
                        placeholder="Detalles adicionales sobre la baja..."
                    />
                </Grid>

                {/* Botón de submit */}
                <Grid item xs={12}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        size="large"
                        startIcon={<SaveIcon />}
                        disabled={submitting || !formik.isValid || !formik.values.producto_id}
                        sx={{ mt: 2 }}
                    >
                        {submitting ? 'Registrando baja...' : 'Registrar Baja'}
                    </Button>
                </Grid>

                {/* Advertencia */}
                <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <strong>Importante:</strong> Esta acción es irreversible. El producto será eliminado del inventario activo.
                    </Alert>
                </Grid>
            </Grid>
        </form>
    );
}