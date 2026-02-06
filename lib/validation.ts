// ============================================
// VALIDATION UTILITIES
// ============================================

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

// ============================================
// EMAIL VALIDATION
// ============================================
export const validateEmail = (email: string): ValidationResult => {
    const errors: ValidationError[] = [];
    
    if (!email || email.trim().length === 0) {
        errors.push({ field: 'email', message: 'Email wajib diisi' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ field: 'email', message: 'Format email tidak valid' });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ============================================
// PASSWORD VALIDATION
// ============================================
export const validatePassword = (password: string): ValidationResult => {
    const errors: ValidationError[] = [];
    
    if (!password || password.trim().length === 0) {
        errors.push({ field: 'password', message: 'Password wajib diisi' });
    } else if (password.length < 6) {
        errors.push({ field: 'password', message: 'Password minimal 6 karakter' });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ============================================
// TRANSACTION VALIDATION
// ============================================
export const validateTransactionItem = (
    deskripsi: string,
    qty: string,
    satuan: string,
    harga: string
): ValidationResult => {
    const errors: ValidationError[] = [];
    
    if (!deskripsi || deskripsi.trim().length === 0) {
        errors.push({ field: 'deskripsi', message: 'Deskripsi wajib diisi' });
    }
    
    if (!qty || qty.trim().length === 0) {
        errors.push({ field: 'qty', message: 'Jumlah wajib diisi' });
    } else if (isNaN(Number(qty)) || Number(qty) <= 0) {
        errors.push({ field: 'qty', message: 'Jumlah harus berupa angka positif' });
    }
    
    if (!satuan || satuan.trim().length === 0) {
        errors.push({ field: 'satuan', message: 'Satuan wajib diisi' });
    }
    
    if (!harga || harga.trim().length === 0) {
        errors.push({ field: 'harga', message: 'Harga wajib diisi' });
    } else if (isNaN(Number(harga)) || Number(harga) <= 0) {
        errors.push({ field: 'harga', message: 'Harga harus berupa angka positif' });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ============================================
// OUTLET VALIDATION
// ============================================
export const validateOutlet = (
    nama_outlet: string,
    pic_name: string,
    saldo_awal: string,
    saldo_limit: string
): ValidationResult => {
    const errors: ValidationError[] = [];
    
    if (!nama_outlet || nama_outlet.trim().length === 0) {
        errors.push({ field: 'nama_outlet', message: 'Nama outlet wajib diisi' });
    } else if (nama_outlet.length < 3) {
        errors.push({ field: 'nama_outlet', message: 'Nama outlet minimal 3 karakter' });
    }
    
    if (!pic_name || pic_name.trim().length === 0) {
        errors.push({ field: 'pic_name', message: 'Nama PIC wajib diisi' });
    }
    
    if (!saldo_awal || saldo_awal.trim().length === 0) {
        errors.push({ field: 'saldo_awal', message: 'Saldo awal wajib diisi' });
    } else if (isNaN(Number(saldo_awal)) || Number(saldo_awal) < 0) {
        errors.push({ field: 'saldo_awal', message: 'Saldo awal harus berupa angka non-negatif' });
    }
    
    if (!saldo_limit || saldo_limit.trim().length === 0) {
        errors.push({ field: 'saldo_limit', message: 'Saldo limit wajib diisi' });
    } else if (isNaN(Number(saldo_limit)) || Number(saldo_limit) <= 0) {
        errors.push({ field: 'saldo_limit', message: 'Saldo limit harus berupa angka positif' });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ============================================
// USER VALIDATION
// ============================================
export const validateUser = (
    username: string,
    nama: string,
    role: string,
    outlet_id: string | null
): ValidationResult => {
    const errors: ValidationError[] = [];
    
    if (!username || username.trim().length === 0) {
        errors.push({ field: 'username', message: 'Username wajib diisi' });
    } else if (username.length < 3) {
        errors.push({ field: 'username', message: 'Username minimal 3 karakter' });
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push({ field: 'username', message: 'Username hanya boleh huruf, angka, dan underscore' });
    }
    
    if (!nama || nama.trim().length === 0) {
        errors.push({ field: 'nama', message: 'Nama lengkap wajib diisi' });
    } else if (nama.length < 3) {
        errors.push({ field: 'nama', message: 'Nama lengkap minimal 3 karakter' });
    }
    
    if (!role || (role !== 'Admin' && role !== 'Kasir')) {
        errors.push({ field: 'role', message: 'Role harus Admin atau Kasir' });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export const formatValidationErrors = (errors: ValidationError[]): string => {
    return errors.map(error => error.message).join(', ');
};

export const getFirstValidationError = (errors: ValidationError[]): string | null => {
    return errors.length > 0 ? errors[0].message : null;
};