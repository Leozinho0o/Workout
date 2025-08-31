
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Theme } from '../types';
import { SunIcon, MoonIcon, MonitorIcon, ChevronRightIcon, ClipboardListIcon, DumbbellIcon, BarChartIcon } from '../components/Icons';

const SettingsScreen: React.FC = () => {
    const { 
        theme, 
        setTheme, 
        setIsPhysicalEvaluationScreenOpen,
        setIsMuscleGroupsScreenOpen,
        setIsPhysicalTestsScreenOpen,
        setInfoModalContent,
    } = useApp();

    const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationStatus(Notification.permission);
        }
    }, []);

    const handleRequestPermission = async () => {
        if (!('Notification' in window)) {
            setInfoModalContent({
                title: 'Notificações não suportadas',
                message: 'Seu navegador não suporta notificações, ou você está em um modo de navegação que as bloqueia.',
                confirmText: 'Entendi',
                showCancelButton: false,
            });
            return;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            setNotificationStatus(permission);
        } else if (Notification.permission === 'denied') {
            setInfoModalContent({
                title: 'Notificações Bloqueadas',
                message: 'Para habilitar as notificações, você precisa alterar as permissões nas configurações do seu navegador ou dispositivo. Geralmente, isso pode ser encontrado clicando no ícone de cadeado na barra de endereço.',
                confirmText: 'Entendi',
                showCancelButton: false,
            });
        } else if (Notification.permission === 'granted') {
            setInfoModalContent({
                title: 'Notificações Ativadas',
                message: 'As notificações já estão ativadas. Para desativá-las, você precisa alterar as permissões nas configurações do seu navegador ou dispositivo.',
                confirmText: 'Entendi',
                showCancelButton: false,
            });
        }
    };
    
    const getStatusInfo = () => {
        switch (notificationStatus) {
            case 'granted':
                return { text: 'Permitido', color: 'text-green-500' };
            case 'denied':
                return { text: 'Negado', color: 'text-red-500' };
            default:
                return { text: 'Padrão', color: 'text-yellow-500' };
        }
    };
    
    const { text: statusText, color: statusColorClass } = getStatusInfo();
    
    const renderPermissionButton = () => {
        switch (notificationStatus) {
            case 'granted':
                return (
                    <button
                        onClick={handleRequestPermission}
                        className="bg-gray-200 dark:bg-gray-600 text-sm font-semibold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                        Gerenciar
                    </button>
                );
            case 'denied':
                return (
                     <button
                        onClick={handleRequestPermission}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-md"
                    >
                        Como Habilitar?
                    </button>
                );
            default: // 'default'
                return (
                     <button
                        onClick={handleRequestPermission}
                        className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2 px-4 rounded-md"
                    >
                        Solicitar Permissão
                    </button>
                );
        }
    };

    const themeOptions = [
        { id: Theme.LIGHT, name: 'Claro', icon: <SunIcon className="h-5 w-5 mr-2" /> },
        { id: Theme.DARK, name: 'Escuro', icon: <MoonIcon className="h-5 w-5 mr-2" /> },
        { id: Theme.SYSTEM, name: 'Sistema', icon: <MonitorIcon className="h-5 w-5 mr-2" /> },
    ];

    return (
        <div className="p-4 space-y-8">
            {/* Theme Selection */}
            <section>
                <h2 className="text-xl font-bold mb-3 text-light-text dark:text-dark-text">Tema</h2>
                <div className="flex space-x-2 rounded-lg bg-light-bg dark:bg-dark-card p-1">
                    {themeOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => setTheme(option.id)}
                            className={`w-full flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${
                                theme === option.id
                                    ? 'bg-primary text-white shadow'
                                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-card dark:hover:bg-dark-border'
                            }`}
                        >
                            {option.icon}
                            {option.name}
                        </button>
                    ))}
                </div>
            </section>
            
            {/* Notifications section */}
            <section>
                <h2 className="text-xl font-bold mb-3 text-light-text dark:text-dark-text">Notificações</h2>
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                        Receba uma notificação persistente enquanto um treino estiver em andamento para não esquecer de finalizá-lo.
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-light-text dark:text-dark-text">
                            Status: <span className={statusColorClass}>{statusText}</span>
                        </span>
                        {renderPermissionButton()}
                    </div>
                </div>
            </section>

            {/* General Settings Buttons */}
            <section className="space-y-4">
                 <button
                    onClick={() => setIsPhysicalEvaluationScreenOpen(true)}
                    className="w-full flex justify-between items-center cursor-pointer p-3 bg-light-card dark:bg-dark-card rounded-lg shadow-sm hover:bg-light-bg dark:hover:bg-dark-border"
                    aria-label="Abrir tela de avaliação física"
                >
                    <div className="flex items-center">
                        <ClipboardListIcon className="h-6 w-6 mr-4 text-primary"/>
                        <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Avaliação Física</h2>
                    </div>
                    <ChevronRightIcon className="h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary"/>
                </button>
                 <button
                    onClick={() => setIsPhysicalTestsScreenOpen(true)}
                    className="w-full flex justify-between items-center cursor-pointer p-3 bg-light-card dark:bg-dark-card rounded-lg shadow-sm hover:bg-light-bg dark:hover:bg-dark-border"
                    aria-label="Abrir tela de testes físicos"
                >
                    <div className="flex items-center">
                        <BarChartIcon className="h-6 w-6 mr-4 text-primary"/>
                        <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Testes Físicos</h2>
                    </div>
                    <ChevronRightIcon className="h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary"/>
                </button>
                 <button
                    onClick={() => setIsMuscleGroupsScreenOpen(true)}
                    className="w-full flex justify-between items-center cursor-pointer p-3 bg-light-card dark:bg-dark-card rounded-lg shadow-sm hover:bg-light-bg dark:hover:bg-dark-border"
                    aria-label="Gerenciar grupos musculares"
                >
                    <div className="flex items-center">
                        <DumbbellIcon className="h-6 w-6 mr-4 text-primary"/>
                        <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Grupos Musculares</h2>
                    </div>
                    <ChevronRightIcon className="h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary"/>
                </button>
            </section>
        </div>
    );
};

export default SettingsScreen;
