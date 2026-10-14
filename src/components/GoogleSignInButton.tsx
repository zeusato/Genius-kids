import React from 'react';
import './GoogleSignInButton.css';

export function GoogleSignInButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
    return <button type="button" className="google-sign-in" onClick={onClick} disabled={disabled}>
        <img src={`${import.meta.env.BASE_URL}auth/google-g.png`} width="20" height="20" alt="" aria-hidden="true" />
        <span>Đăng nhập bằng Google</span>
    </button>;
}
