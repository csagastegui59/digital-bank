# Sistema de Transferencias Bancarias

Sistema bancario básico que permite transferencias entre cuentas de usuarios con soporte para múltiples monedas (USD y PEN).

## Características Principales

### Cuentas Bancarias
- ✅ Cuenta inicial automática en USD con $1000 al registrarse
- ✅ Soporte para múltiples cuentas por usuario
- ✅ Monedas disponibles: USD (dólares) y PEN (soles peruanos)
- ✅ Máximo una cuenta por moneda por usuario
- ✅ Cuentas adicionales requieren aprobación de administrador
- ✅ Activación/desactivación de cuentas por administrador

### Transferencias
- ✅ Transferencias entre cuentas de diferentes usuarios
- ✅ Conversión automática de moneda con tipo de cambio
- ✅ Precisión de 2 decimales para operaciones bancarias
- ✅ Tipo de cambio guardado en cada transacción
- ✅ Validación de saldo suficiente
- ✅ Solo cuentas activas pueden operar
- ✅ Transacciones atómicas (todo o nada)

### Seguridad y Permisos
- ✅ Autenticación JWT con access token y refresh token
- ✅ Roles: CUSTOMER y ADMIN
- ✅ Clientes solo pueden ver/operar sus propias cuentas
- ✅ Administradores pueden ver todas las cuentas y transacciones
- ✅ Administradores pueden activar/desactivar cuentas

## Tipos de Cambio

Los tipos de cambio están definidos en el sistema:
- **USD → PEN**: 3.75
- **PEN → USD**: 0.2667

> Nota: En producción, estos valores deberían obtenerse de una API externa de tipos de cambio.

## Endpoints Principales

### Autenticación
- `POST /auth/signup` - Registrar nuevo usuario (crea cuenta USD automáticamente)
- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Renovar tokens
- `POST /auth/logout` - Cerrar sesión

### Cuentas
- `GET /accounts` - Ver todas las cuentas **(Admin)**
- `GET /accounts/pending` - Ver cuentas pendientes de aprobación **(Admin)**
- `GET /accounts/user/:userId` - Ver cuentas de un usuario **(Admin o Propietario)**
- `POST /accounts/request` - Solicitar nueva cuenta en otra moneda
- `PATCH /accounts/:accountId/activate` - Activar cuenta **(Admin)**
- `PATCH /accounts/:accountId/deactivate` - Desactivar cuenta **(Admin)**

### Transacciones
- `GET /transactions` - Ver todas las transacciones **(Admin)**
- `GET /transactions/user/:userId` - Ver transacciones de un usuario **(Admin o Propietario)**
- `POST /transactions/transfer` - Realizar transferencia

## Flujo de Uso

### Para Clientes (CUSTOMER)

1. **Registrarse**
   ```bash
   POST /auth/signup
   {
     "email": "cliente@example.com",
     "password": "password123"
   }
   ```
   - Se crea automáticamente una cuenta en USD con $1000.00

2. **Obtener mis cuentas**
   ```bash
   GET /accounts/user/{myUserId}
   ```

3. **Solicitar cuenta en PEN**
   ```bash
   POST /accounts/request
   {
     "currency": "PEN"
   }
   ```
   - La cuenta queda pendiente de aprobación

4. **Realizar transferencia**
   ```bash
   POST /transactions/transfer
   {
     "fromAccountId": "uuid-mi-cuenta",
     "toAccountId": "uuid-cuenta-destino",
     "amount": 100.50,
     "description": "Pago de servicio"
   }
   ```

5. **Ver mis transacciones**
   ```bash
   GET /transactions/user/{myUserId}
   ```

### Para Administradores (ADMIN)

1. **Ver cuentas pendientes**
   ```bash
   GET /accounts/pending
   ```

2. **Aprobar cuenta**
   ```bash
   PATCH /accounts/{accountId}/activate
   ```

3. **Ver todas las transacciones**
   ```bash
   GET /transactions
   ```

4. **Desactivar cuenta (si necesario)**
   ```bash
   PATCH /accounts/{accountId}/deactivate
   ```

## Ejemplos de Transferencias

### Transferencia en la misma moneda (USD → USD)
```json
{
  "fromAccountId": "uuid-cuenta-usd-1",
  "toAccountId": "uuid-cuenta-usd-2",
  "amount": 150.75,
  "description": "Pago entre amigos"
}
```
- Se transfiere $150.75
- No hay conversión de moneda
- `exchangeRate` será `null`

### Transferencia con conversión (USD → PEN)
```json
{
  "fromAccountId": "uuid-cuenta-usd",
  "toAccountId": "uuid-cuenta-pen",
  "amount": 100.00,
  "description": "Conversión a soles"
}
```
- Se debitan $100.00 de la cuenta USD
- Se acreditan S/. 375.00 en la cuenta PEN (100 * 3.75)
- `exchangeRate` será `"3.750000"`

### Transferencia con conversión (PEN → USD)
```json
{
  "fromAccountId": "uuid-cuenta-pen",
  "toAccountId": "uuid-cuenta-usd",
  "amount": 375.00,
  "description": "Conversión a dólares"
}
```
- Se debitan S/. 375.00 de la cuenta PEN
- Se acreditan $100.01 en la cuenta USD (375 * 0.2667)
- `exchangeRate` será `"0.266700"`

## Validaciones Importantes

### Al transferir
- ✅ La cuenta origen debe pertenecer al usuario
- ✅ Ambas cuentas deben estar activas
- ✅ Debe haber saldo suficiente
- ✅ El monto debe ser mayor a 0
- ✅ Las cuentas origen y destino deben existir

### Al solicitar nueva cuenta
- ❌ No se puede tener más de una cuenta en la misma moneda
- ✅ La cuenta se crea inactiva y requiere aprobación

### Redondeo
- Todos los montos se redondean a 2 decimales
- Ejemplo: 100.456 → 100.46

## Estados de Cuenta

- **isActive: true** - Cuenta activa, puede recibir y enviar transferencias
- **isActive: false** - Cuenta inactiva, no puede operar

## Estados de Transacción

- **PENDING** - Pendiente de procesar
- **POSTED** - Procesada exitosamente
- **REVERSED** - Revertida
