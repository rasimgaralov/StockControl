<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:roles-rules -->
# User Roles and Permissions (StockControl)

Always adhere to these role-based access control (RBAC) rules when modifying or adding new features:

## 1. Admin (`admin`)
- **Access**: Full access to all system features (`view`, `add`, `edit`, `delete`, `manageUsers`).
- **Specific Rules**:
  - The only role that can access and manage the **Users** module (`manageUsers: true`).
  - The only role that can edit or delete an invoice in the **Activi** (`faturalar`) module.

## 2. Manager (`manager`)
- **Access**: High-level access (`view`, `add`, `edit`, `delete`), but cannot manage users (`manageUsers: false`).
- **Specific Rules**:
  - Can view and add invoices, but **cannot edit or delete** invoices.
  - Has full access to Products and Transfers without department restrictions.

## 3. Editor (`editor`)
- **Access**: Limited active access (`view: true`, `add: true`, `edit: false`, `delete: false`, `manageUsers: false`).
- **Specific Rules**:
  - **Products (Ürünler) Module**: Limited to adding/viewing products *only* for the "Warehouse" department.
  - **Transfers (Transferler) Module**: The "From" (Source) department must be strictly locked to "Warehouse" and the select input must be disabled.
  - **Invoices (Faturalar) Module**: Can access the page, add invoices, but cannot edit or delete.

## 4. User (`user`)
- **Access**: Read-only access (`view: true`, `add: false`, `edit: false`, `delete: false`, `manageUsers: false`).
- **Specific Rules**:
  - **No Access**: Cannot access the **Invoices** (`faturalar`) module at all.
<!-- END:roles-rules -->
