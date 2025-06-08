import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { state, login, register } = useStore();

  // ... (mantener useEffect y validateForm como están)

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setErrors({});

    try {
      console.log('📝 Form submitted:', { isRegister, email });
      
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      
      console.log('✅ Auth function completed successfully');
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      setErrors({ general: error.message || 'Error de autenticación. Intenta de nuevo.' });
    }
  };

  // ... (mantener el resto del componente como está)
}
