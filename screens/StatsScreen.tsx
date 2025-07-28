import React, { useMemo, useState } from 'react';
import { useApp } from '../App';
import { WorkoutSession, Routine, ExerciseCategory, Unit, MeasurementType } from '../types';
import { ChevronRightIcon } from '../components/Icons';


// Helper function to format a Date object to a 'YYYY-MM-DD' string for date inputs
const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

interface ChartData {
    label: string;
    value: number; // Total value
    details?: { name: string; value: number; color: string }[];
}

// BarChart Component for displaying workout data
const BarChart: React.FC<{ data: ChartData[]; isStacked?: boolean; unit: string }> = ({ data, isStacked = false, unit }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-10 p-4 bg-light-bg dark:bg-dark-bg rounded-lg">
                <p>Nenhum treino concluído no período selecionado.</p>
            </div>
        );
    }
    
    const maxValue = Math.max(...data.map(d => d.value), 1); // Use 1 as a minimum to avoid division by zero

    return (
        <div className="relative h-64 mt-6" aria-label={`Gráfico de colunas de ${unit} dos treinos`}>
            {/* Y-Axis Labels */}
            <div className="absolute top-0 bottom-0 -left-2 flex flex-col justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary -translate-x-full pr-2" aria-hidden="true">
                <span>{Math.ceil(maxValue)} {unit}</span>
                <span>0 {unit}</span>
            </div>
            {/* Chart Area */}
            <div className="h-full flex justify-around items-end gap-2 border-l border-b border-light-border dark:border-dark-border pl-2 pb-1">
                {data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                        <div
                            className="w-full flex flex-col rounded-t-md overflow-hidden"
                            aria-label={`${item.label}: ${item.value} ${unit}`}
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                        >
                            {isStacked && item.details && item.details.length > 1 ? (
                                item.details.map((detail, detailIndex) => (
                                    <div
                                        key={detailIndex}
                                        className={`w-full transition-all group-hover:opacity-80 ${detailIndex < (item.details?.length || 0) - 1 ? 'border-b-2 border-black' : ''}`}
                                        style={{
                                            height: `${(detail.value / item.value) * 100}%`,
                                            backgroundColor: detail.color,
                                        }}
                                    />
                                ))
                            ) : (
                                <div
                                    className="w-full h-full"
                                    style={{ backgroundColor: item.details?.[0]?.color || '#3B82F6' }}
                                />
                            )}
                        </div>
                        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-dark-bg text-dark-text text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2 z-10">
                            <p className="font-bold border-b border-dark-border pb-1 mb-1 text-left">{item.label}: {item.value} {unit}</p>
                            {item.details && (
                                <ul className="list-none text-left space-y-1">
                                    {item.details.map((detail, i) => (
                                        <li key={i} className="whitespace-nowrap flex items-center">
                                            <span className="h-2 w-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: detail.color }}></span>
                                            <span>{detail.name}: {detail.value} {unit}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
            </div>
             {/* X-Axis Labels */}
             <div className="h-6 flex justify-around items-start pt-1">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary truncate px-1" title={item.label} aria-hidden="true">
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

const HorizontalBarChart: React.FC<{ data: ChartData[]; unit: string }> = ({ data, unit }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-light-text-secondary dark:text-dark-text-secondary mt-10 p-4 bg-light-bg dark:bg-dark-bg rounded-lg">
                <p>Nenhum grupo muscular encontrado.</p>
            </div>
        );
    }
    
    // Sort data here to ensure it's always descending by value for better visualization
    const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
    const maxValue = useMemo(() => Math.max(...sortedData.map(d => d.value), 1), [sortedData]);

    return (
        <div className="mt-4 space-y-3 text-sm" aria-label={`Gráfico de barras de ${unit} por grupo muscular`}>
            {sortedData.map((item, index) => (
                <div key={index} className="grid grid-cols-5 items-center gap-x-2">
                    <div className="col-span-2 text-right text-light-text dark:text-dark-text truncate pr-2 font-medium" title={item.label}>
                        {item.label}
                    </div>
                    <div className="col-span-3 flex items-center">
                        <div className="w-full bg-light-bg dark:bg-dark-bg rounded-full h-5 relative">
                           <div 
                                className="absolute top-0 left-0 h-5 bg-primary rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            />
                        </div>
                        <span className="ml-3 w-10 text-left font-semibold text-light-text-secondary dark:text-dark-text-secondary">{item.value}</span>
                    </div>
                </div>
            ))}
            <div className="grid grid-cols-5 gap-2 mt-2 border-t border-light-border dark:border-dark-border pt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                <div className="col-span-2" />
                <div className="col-span-3 flex items-center">
                    <div className="w-full flex justify-between">
                         <span>0</span>
                         <span>{Math.ceil(maxValue)} {unit}</span>
                    </div>
                    <div className="w-10 ml-3" />
                </div>
            </div>
        </div>
    );
};

const parseEffortToNumber = (effort: string | undefined): number => {
    if (!effort) {
        return 0;
    }
    // Handle ranges like '5-6' or '1-4' by taking the average
    if (effort.includes('-')) {
        const parts = effort.split('-').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return (parts[0] + parts[1]) / 2;
        }
    }
    // Handle single numbers like '9.5' or '8'
    const num = parseFloat(effort);
    return isNaN(num) ? 0 : num;
};


// Main StatsScreen Component
const StatsScreen: React.FC = () => {
    const { workouts, routines, exercises, muscleGroups } = useApp();
    const [isGeralExpanded, setIsGeralExpanded] = useState(false);
    const [isResistidoExpanded, setIsResistidoExpanded] = useState(false);
    const [isCardioExpanded, setIsCardioExpanded] = useState(false);
    const [isFlexibilidadeExpanded, setIsFlexibilidadeExpanded] = useState(false);

    // Default to last 7 days
    const [endDate, setEndDate] = useState(formatDateForInput(new Date()));
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6); // Set to 6 days ago for a 7-day total period
        return formatDateForInput(d);
    });

    const filteredWorkouts = useMemo(() => {
         if (!startDate || !endDate) return [];
         const start = new Date(`${startDate}T00:00:00`);
         const end = new Date(`${endDate}T23:59:59`);
         return workouts
            .filter((w: WorkoutSession) => {
                if (!w.completed || !w.date) return false;
                const workoutDate = new Date(`${w.date}T00:00:00`);
                return workoutDate >= start && workoutDate <= end;
            });
    }, [workouts, startDate, endDate]);

    const dailyDurationData = useMemo<ChartData[]>(() => {
        if (!startDate || !endDate) return [];
        
        const dataByDate = new Map<string, { totalDuration: number; details: { name: string; value: number; color: string }[] }>();
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);
        
        // Initialize all days in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateKey = formatDateForInput(currentDate);
            dataByDate.set(dateKey, { totalDuration: 0, details: [] });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Populate with workout data
        filteredWorkouts.forEach((w: WorkoutSession) => {
            const dateKey = w.date;
            if (dataByDate.has(dateKey)) {
                const dayData = dataByDate.get(dateKey)!;
                const durationInMinutes = Math.round((w.duration || 0) / 60);
                const routine = routines.find((r: Routine) => r.id === w.routineId);
                
                if (durationInMinutes > 0) {
                    dayData.totalDuration += durationInMinutes;
                    dayData.details.push({
                        name: routine?.name || 'Rotina Apagada',
                        value: durationInMinutes,
                        color: routine?.color || '#808080' // Gray for deleted routines
                    });
                }
            }
        });
        
        return Array.from(dataByDate.entries()).map(([date, data]) => ({
            label: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: data.totalDuration,
            details: data.details,
        }));
    }, [filteredWorkouts, routines, startDate, endDate]);
    
    const dailyVolumeData = useMemo<ChartData[]>(() => {
        if (!startDate || !endDate) return [];
        
        const dataByDate = new Map<string, { totalVolume: number; details: { name: string; value: number; color: string }[] }>();
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);

        // Initialize all days in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateKey = formatDateForInput(currentDate);
            dataByDate.set(dateKey, { totalVolume: 0, details: [] });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate with workout data
        filteredWorkouts.forEach((w: WorkoutSession) => {
            const dateKey = w.date;
            if (!dataByDate.has(dateKey)) return;

            const dayData = dataByDate.get(dateKey)!;
            const routine = routines.find((r: Routine) => r.id === w.routineId);
            
            let routineVolume = 0;
            w.loggedExercises.forEach(loggedEx => {
                const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                if (exercise && exercise.category === ExerciseCategory.RESISTED && exercise.unit === Unit.KG) {
                    loggedEx.sets.forEach(set => {
                        const reps = set.reps ?? 0;
                        const weight = set.value ?? 0;
                        if (reps > 0 && weight > 0) {
                            routineVolume += reps * weight;
                        }
                    });
                }
            });

            if (routineVolume > 0) {
                dayData.totalVolume += routineVolume;
                dayData.details.push({
                    name: routine?.name || 'Rotina Apagada',
                    value: routineVolume,
                    color: routine?.color || '#808080'
                });
            }
        });

        return Array.from(dataByDate.entries()).map(([date, data]) => ({
            label: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: Math.round(data.totalVolume), // Round to nearest integer for display
            details: data.details.map(d => ({ ...d, value: Math.round(d.value) })),
        }));
    }, [filteredWorkouts, routines, exercises, startDate, endDate]);

    const dailyInternalLoadData = useMemo<ChartData[]>(() => {
        if (!startDate || !endDate) return [];
        
        const dataByDate = new Map<string, { totalLoad: number; details: { name: string; value: number; color: string }[] }>();
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);
    
        // Initialize all days in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateKey = formatDateForInput(currentDate);
            dataByDate.set(dateKey, { totalLoad: 0, details: [] });
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        // Populate with workout data
        filteredWorkouts.forEach((w: WorkoutSession) => {
            const dateKey = w.date;
            if (!dataByDate.has(dateKey)) return;
    
            const dayData = dataByDate.get(dateKey)!;
            const routine = routines.find((r: Routine) => r.id === w.routineId);
            
            let routineInternalLoad = 0;
            w.loggedExercises.forEach(loggedEx => {
                const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                if (exercise && exercise.category === ExerciseCategory.RESISTED) {
                    loggedEx.sets.forEach(set => {
                        const reps = set.reps ?? 0;
                        const weight = set.value ?? 0;
                        const effortValue = parseEffortToNumber(set.effort);
                        const weightedLoad = reps * weight * effortValue;
                        routineInternalLoad += weightedLoad;
                    });
                }
            });
    
            if (routineInternalLoad > 0) {
                dayData.totalLoad += routineInternalLoad;
                dayData.details.push({
                    name: routine?.name || 'Rotina Apagada',
                    value: routineInternalLoad,
                    color: routine?.color || '#808080'
                });
            }
        });
    
        return Array.from(dataByDate.entries()).map(([date, data]) => ({
            label: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: parseFloat(data.totalLoad.toFixed(2)),
            details: data.details.map(d => ({ ...d, value: parseFloat(d.value.toFixed(2)) })),
        }));
    }, [filteredWorkouts, routines, exercises, startDate, endDate]);
    
    const seriesByMuscleGroupData = useMemo<ChartData[]>(() => {
        const dataByMuscle = new Map<string, number>();
        muscleGroups.forEach(muscle => {
            dataByMuscle.set(muscle, 0);
        });

        filteredWorkouts.forEach((w: WorkoutSession) => {
            w.loggedExercises.forEach(loggedEx => {
                const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                if (exercise && exercise.category === ExerciseCategory.RESISTED) {
                    const numSets = loggedEx.sets.length;
                    if (numSets > 0) {
                        const uniqueMuscles = new Set([...exercise.primaryMuscles, ...exercise.secondaryMuscles]);
                        uniqueMuscles.forEach(muscle => {
                            if (dataByMuscle.has(muscle)) {
                                dataByMuscle.set(muscle, dataByMuscle.get(muscle)! + numSets);
                            }
                        });
                    }
                }
            });
        });

        const chartData = Array.from(dataByMuscle.entries())
            .map(([muscle, count]) => ({
                label: muscle,
                value: count,
            }));

        return chartData;
    }, [filteredWorkouts, exercises, muscleGroups]);
    
    const dailyCardioLoadData = useMemo<ChartData[]>(() => {
        if (!startDate || !endDate) return [];
        
        const dataByDate = new Map<string, { totalLoad: number; details: { name: string; value: number; color: string }[] }>();
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);
    
        // Initialize all days in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateKey = formatDateForInput(currentDate);
            dataByDate.set(dateKey, { totalLoad: 0, details: [] });
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        // Populate with workout data
        filteredWorkouts.forEach((w: WorkoutSession) => {
            const dateKey = w.date;
            if (!dataByDate.has(dateKey)) return;
    
            const dayData = dataByDate.get(dateKey)!;
            const routine = routines.find((r: Routine) => r.id === w.routineId);
            
            let routineCardioLoad = 0;
            w.loggedExercises.forEach(loggedEx => {
                const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                if (exercise && exercise.category === ExerciseCategory.CARDIO) {
                    loggedEx.sets.forEach(set => {
                        const timeInSeconds = set.time ?? 0;
                        const timeInMinutes = timeInSeconds / 60;
                        const value = set.value ?? 0;
                        if (timeInMinutes > 0 && value > 0) {
                            routineCardioLoad += timeInMinutes * value;
                        }
                    });
                }
            });
    
            if (routineCardioLoad > 0) {
                dayData.totalLoad += routineCardioLoad;
                dayData.details.push({
                    name: routine?.name || 'Rotina Apagada',
                    value: routineCardioLoad,
                    color: routine?.color || '#808080'
                });
            }
        });
    
        return Array.from(dataByDate.entries()).map(([date, data]) => ({
            label: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: parseFloat(data.totalLoad.toFixed(2)),
            details: data.details.map(d => ({ ...d, value: parseFloat(d.value.toFixed(2)) })),
        }));
    }, [filteredWorkouts, routines, exercises, startDate, endDate]);

    const dailyCardioInternalLoadData = useMemo<ChartData[]>(() => {
        if (!startDate || !endDate) return [];
        
        const dataByDate = new Map<string, { totalLoad: number; details: { name: string; value: number; color: string }[] }>();
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);
    
        // Initialize all days in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateKey = formatDateForInput(currentDate);
            dataByDate.set(dateKey, { totalLoad: 0, details: [] });
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        // Populate with workout data
        filteredWorkouts.forEach((w: WorkoutSession) => {
            const dateKey = w.date;
            if (!dataByDate.has(dateKey)) return;
    
            const dayData = dataByDate.get(dateKey)!;
            const routine = routines.find((r: Routine) => r.id === w.routineId);
            
            let routineCardioInternalLoad = 0;
            w.loggedExercises.forEach(loggedEx => {
                const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                if (exercise && exercise.category === ExerciseCategory.CARDIO) {
                    loggedEx.sets.forEach(set => {
                        const timeInSeconds = set.time ?? 0;
                        const timeInMinutes = timeInSeconds / 60;
                        const effortValue = parseEffortToNumber(set.effort);
                        if (timeInMinutes > 0 && effortValue > 0) {
                            routineCardioInternalLoad += timeInMinutes * effortValue;
                        }
                    });
                }
            });
    
            if (routineCardioInternalLoad > 0) {
                dayData.totalLoad += routineCardioInternalLoad;
                dayData.details.push({
                    name: routine?.name || 'Rotina Apagada',
                    value: routineCardioInternalLoad,
                    color: routine?.color || '#808080'
                });
            }
        });
    
        return Array.from(dataByDate.entries()).map(([date, data]) => ({
            label: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: parseFloat(data.totalLoad.toFixed(2)),
            details: data.details.map(d => ({ ...d, value: parseFloat(d.value.toFixed(2)) })),
        }));
    }, [filteredWorkouts, routines, exercises, startDate, endDate]);

    const dailyFlexibilityLoadData = useMemo<ChartData[]>(() => {
        if (!startDate || !endDate) return [];
        
        const dataByDate = new Map<string, { totalLoad: number; details: { name: string; value: number; color: string }[] }>();
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);
    
        // Initialize all days in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateKey = formatDateForInput(currentDate);
            dataByDate.set(dateKey, { totalLoad: 0, details: [] });
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        // Populate with workout data
        filteredWorkouts.forEach((w: WorkoutSession) => {
            const dateKey = w.date;
            if (!dataByDate.has(dateKey)) return;
    
            const dayData = dataByDate.get(dateKey)!;
            const routine = routines.find((r: Routine) => r.id === w.routineId);
            
            let routineFlexibilityLoad = 0;
            w.loggedExercises.forEach(loggedEx => {
                const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                if (exercise && exercise.category === ExerciseCategory.FLEXIBILITY) {
                    loggedEx.sets.forEach(set => {
                        const effortValue = parseEffortToNumber(set.effort);
                        let baseValue = 0;

                        if (exercise.measurementType === MeasurementType.TIME) {
                            const timeInSeconds = set.time ?? 0;
                            baseValue = timeInSeconds / 60; // Time in minutes
                        } else { // MeasurementType.COUNT
                            baseValue = set.reps ?? 0;
                        }

                        if (baseValue > 0 && effortValue > 0) {
                            routineFlexibilityLoad += baseValue * effortValue;
                        }
                    });
                }
            });
    
            if (routineFlexibilityLoad > 0) {
                dayData.totalLoad += routineFlexibilityLoad;
                dayData.details.push({
                    name: routine?.name || 'Rotina Apagada',
                    value: routineFlexibilityLoad,
                    color: routine?.color || '#808080'
                });
            }
        });
    
        return Array.from(dataByDate.entries()).map(([date, data]) => ({
            label: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: parseFloat(data.totalLoad.toFixed(2)),
            details: data.details.map(d => ({ ...d, value: parseFloat(d.value.toFixed(2)) })),
        }));
    }, [filteredWorkouts, routines, exercises, startDate, endDate]);

    const seriesByMuscleGroupFlexibilityData = useMemo<ChartData[]>(() => {
        const dataByMuscle = new Map<string, number>();
        muscleGroups.forEach(muscle => {
            dataByMuscle.set(muscle, 0);
        });

        filteredWorkouts.forEach((w: WorkoutSession) => {
            w.loggedExercises.forEach(loggedEx => {
                const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                if (exercise && exercise.category === ExerciseCategory.FLEXIBILITY) {
                    const numSets = loggedEx.sets.length;
                    if (numSets > 0) {
                        const uniqueMuscles = new Set([...exercise.primaryMuscles, ...exercise.secondaryMuscles]);
                        uniqueMuscles.forEach(muscle => {
                            if (dataByMuscle.has(muscle)) {
                                dataByMuscle.set(muscle, dataByMuscle.get(muscle)! + numSets);
                            }
                        });
                    }
                }
            });
        });

        const chartData = Array.from(dataByMuscle.entries())
            .map(([muscle, count]) => ({
                label: muscle,
                value: count,
            }));

        return chartData;
    }, [filteredWorkouts, exercises, muscleGroups]);

    return (
        <div className="p-4 space-y-6 overflow-y-auto">
            <section className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-3">Filtro de Período</h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">Selecione um intervalo para visualizar as estatísticas dos treinos concluídos.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium mb-1">Data de Início</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2"
                            max={endDate}
                        />
                    </div>
                    <div>
                         <label htmlFor="endDate" className="block text-sm font-medium mb-1">Data Final</label>
                         <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2"
                            min={startDate}
                            max={formatDateForInput(new Date())}
                        />
                    </div>
                 </div>
            </section>
        
            <section className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
                <button
                    className="w-full flex justify-between items-center cursor-pointer"
                    onClick={() => setIsGeralExpanded(!isGeralExpanded)}
                    aria-expanded={isGeralExpanded}
                    aria-controls="geral-stats-content"
                >
                    <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Geral</h2>
                    <ChevronRightIcon className={`h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isGeralExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {isGeralExpanded && (
                    <div id="geral-stats-content" className="mt-4">
                        <div className="pl-8 pt-4 space-y-12">
                            <div>
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">Duração Diária dos Treinos</h3>
                                <BarChart data={dailyDurationData} isStacked={true} unit="min" />
                            </div>
                        </div>
                    </div>
                )}
            </section>

             <section className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
                <button
                    className="w-full flex justify-between items-center cursor-pointer"
                    onClick={() => setIsResistidoExpanded(!isResistidoExpanded)}
                    aria-expanded={isResistidoExpanded}
                    aria-controls="resistido-stats-content"
                >
                    <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Resistido</h2>
                    <ChevronRightIcon className={`h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isResistidoExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {isResistidoExpanded && (
                    <div id="resistido-stats-content" className="mt-4">
                         <div className="pt-4 space-y-12">
                            <div className="pl-8">
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">Carga Externa (Kg)</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Cálculo: (séries x repetições x carga)</p>
                                <BarChart data={dailyVolumeData} isStacked={true} unit="Kg" />
                            </div>
                            <div className="pl-8">
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">Carga Interna (UA)</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Cálculo: (séries x repetições x carga x esforço)</p>
                                <BarChart data={dailyInternalLoadData} isStacked={true} unit="UA" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">Séries por Grupo Muscular</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Soma do número de séries de todos os exercícios resistidos que trabalham cada grupo muscular.</p>
                                <HorizontalBarChart data={seriesByMuscleGroupData} unit="séries" />
                            </div>
                        </div>
                    </div>
                )}
            </section>

             <section className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
                <button
                    className="w-full flex justify-between items-center cursor-pointer"
                    onClick={() => setIsCardioExpanded(!isCardioExpanded)}
                    aria-expanded={isCardioExpanded}
                    aria-controls="cardio-stats-content"
                >
                    <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Cardiovascular</h2>
                    <ChevronRightIcon className={`h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isCardioExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {isCardioExpanded && (
                    <div id="cardio-stats-content" className="mt-4">
                         <div className="pl-8 pt-4 space-y-12">
                            <div>
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">Carga Externa</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Cálculo: (tempo em minutos x (velocidade ou distância))</p>
                                <BarChart data={dailyCardioLoadData} isStacked={true} unit="UA" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">Carga Interna (UA)</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Cálculo: (tempo em minutos x esforço)</p>
                                <BarChart data={dailyCardioInternalLoadData} isStacked={true} unit="UA" />
                            </div>
                        </div>
                    </div>
                )}
            </section>
             <section className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
                <button
                    className="w-full flex justify-between items-center cursor-pointer"
                    onClick={() => setIsFlexibilidadeExpanded(!isFlexibilidadeExpanded)}
                    aria-expanded={isFlexibilidadeExpanded}
                    aria-controls="flexibilidade-stats-content"
                >
                    <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Flexibilidade</h2>
                    <ChevronRightIcon className={`h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isFlexibilidadeExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {isFlexibilidadeExpanded && (
                    <div id="flexibilidade-stats-content" className="mt-4">
                         <div className="pt-4 space-y-12">
                            <div className="pl-8">
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">Carga Interna</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Cálculo: ((tempo em min) ou repetições) x esforço</p>
                                <BarChart data={dailyFlexibilityLoadData} isStacked={true} unit="UA" />
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-1">Séries por Grupo Muscular</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Soma do número de séries de todos os exercícios de flexibilidade que trabalham cada grupo muscular.</p>
                                <HorizontalBarChart data={seriesByMuscleGroupFlexibilityData} unit="séries" />
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default StatsScreen;