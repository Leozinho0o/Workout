
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../App';
import { Exercise, WorkoutSession, LoggedExercise, WorkoutSet, MeasurementType, Unit, PerceivedExertionScale, ExerciseCategory } from '../types';
import { ChevronLeftIcon, PlusIcon, TrashIcon, XIcon, CheckCircleIcon, ChevronDownIcon } from '../components/Icons';
import { getScaleOptions } from '../constants';
import ConfirmationModal from '../components/ConfirmationModal';

const formatSecondsToMMSS = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds < 0) {
    return '';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return '00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    
    if (hours > 0) {
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${paddedMinutes}:${paddedSeconds}`;
};

const parseTimeToSeconds = (timeStr: string): number | undefined => {
    if (!timeStr || typeof timeStr !== 'string' || timeStr.trim() === '') {
        return undefined;
    }

    const cleanValue = timeStr.replace(/[^0-9:]/g, '');
    if (cleanValue.trim() === '') return undefined;

    if (cleanValue.includes(':')) {
        const parts = cleanValue.split(':');
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        if (isNaN(minutes) || isNaN(seconds)) return undefined;
        return minutes * 60 + seconds;
    }

    const num = parseInt(cleanValue, 10);
    if (isNaN(num)) return undefined;

    // Smart parsing for numbers without a colon:
    // Treat as MMSS, e.g., 130 -> 1 minute 30 seconds
    if (num >= 100) {
        const minutes = Math.floor(num / 100);
        const seconds = num % 100;
        return minutes * 60 + seconds;
    }
    
    // Treat numbers under 100 as raw seconds
    return num;
};


// Time Input Component for better UX
interface TimeInputProps {
  id: string; 
  valueInSeconds: number | undefined;
  onChangeInSeconds: (seconds: number | undefined) => void;
  placeholder: string;
  className: string;
}

const TimeInput: React.FC<TimeInputProps> = ({ id, valueInSeconds, onChangeInSeconds, placeholder, className }) => {
    const [displayValue, setDisplayValue] = useState(() => formatSecondsToMMSS(valueInSeconds));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Only update display value from props if the input is not focused
        if (document.activeElement !== inputRef.current) {
            setDisplayValue(formatSecondsToMMSS(valueInSeconds));
        }
    }, [valueInSeconds]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const seconds = parseTimeToSeconds(e.target.value);
        onChangeInSeconds(seconds);
        // Re-format display value after blur
        setDisplayValue(formatSecondsToMMSS(seconds));
    };

    return (
        <input
            ref={inputRef}
            id={id}
            type="tel"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
        />
    );
};


// Add a temporary ID to each logged exercise for stable keys and state updates
type TempLoggedExercise = LoggedExercise & { tempId: string };

const WorkoutSessionScreen: React.FC = () => {
    const { 
        activeWorkoutSession, 
        setActiveWorkoutSession, 
        routines, 
        exercises, 
        updateWorkout,
        logWorkout,
        deleteWorkout
    } = useApp();
    
    // Store the original plan in a ref to use for placeholders. It's stable across re-renders.
    const originalPlanRef = useRef(
        (activeWorkoutSession?.loggedExercises || []).map(ex => ({ ...ex }))
    );
    
    const [elapsedTime, setElapsedTime] = useState(activeWorkoutSession?.duration || 0);
    const [isTimerEditModalOpen, setIsTimerEditModalOpen] = useState(false);

    useEffect(() => {
        if (activeWorkoutSession?.completed) {
            return; // Don't start timer for completed workouts
        }

        const timerId = setInterval(() => {
            setElapsedTime(prevTime => prevTime + 1);
        }, 1000);

        return () => {
            clearInterval(timerId);
        };
    }, [activeWorkoutSession?.completed]);

    // This function creates the initial state for the workout session.
    // It runs only once when the component mounts.
    const [initialLoggedExercises] = useState(() => {
        const sourceExercises = activeWorkoutSession?.loggedExercises || [];
        // Use a stable prefix for the tempId to ensure consistent keys.
        const idPrefix = activeWorkoutSession?.id || `new-${Date.now()}`;
        
        // If editing a completed workout, use the logged data as is.
        if (activeWorkoutSession?.completed) {
            return sourceExercises.map((ex, index) => ({
                ...ex,
                tempId: `le-${idPrefix}-${index}`
            }));
        }

        // If starting a new workout, prepare the state for logging by clearing loggable fields.
        return sourceExercises.map((plannedEx, index) => ({
            ...plannedEx,
            sets: plannedEx.sets.map((set: WorkoutSet) => ({
                repsMin: set.repsMin,
                repsMax: set.repsMax,
                // These fields will be filled by the user. They start empty.
                reps: undefined,
                time: undefined,
                value: undefined,
                effort: undefined,
                completed: false,
            })),
            tempId: `le-${idPrefix}-${index}`
        }));
    });
    
    const [loggedExercises, setLoggedExercises] = useState<TempLoggedExercise[]>(initialLoggedExercises);
    const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

    const routine = useMemo(() => 
        routines.find(r => r.id === activeWorkoutSession?.routineId),
    [routines, activeWorkoutSession]);
    
    if (!activeWorkoutSession || !routine) {
        return (
            <div className="p-4 text-center">
                <p>Erro: Sessão de treino ou rotina não encontrada.</p>
                <button onClick={() => setActiveWorkoutSession(null)} className="mt-4 bg-primary text-white p-2 rounded">
                    Voltar
                </button>
            </div>
        );
    }

    const handleAddExercise = (exerciseId: string) => {
        const newLoggedExercise: TempLoggedExercise = {
            exerciseId,
            sets: [{}],
            notes: '',
            tempId: `le-${Date.now()}`
        };
        setLoggedExercises(current => [...current, newLoggedExercise]);
        setIsExercisePickerOpen(false);
    };
    
    const handleRemoveExercise = (tempIdToRemove: string) => {
        setLoggedExercises(current => current.filter(ex => ex.tempId !== tempIdToRemove));
    };

    const handleExerciseNoteChange = (tempId: string, value: string) => {
        setLoggedExercises(currentLogs =>
            currentLogs.map(log =>
                log.tempId === tempId ? { ...log, notes: value } : log
            )
        );
    };

    const handleSetChange = (tempId: string, setIndex: number, field: keyof WorkoutSet, value: string) => {
        setLoggedExercises(currentLogs => currentLogs.map(log => {
            if (log.tempId !== tempId) return log;

            const newSets = [...log.sets];
            const updatedSet = { ...(newSets[setIndex] || {}) };
            
            if (field === 'effort') {
                updatedSet.effort = value === '' ? undefined : value;
            } else { // reps, value
                const numericValue = value === '' ? undefined : Number(value);
                (updatedSet as any)[field] = numericValue;
            }
            
            newSets[setIndex] = updatedSet;
            return { ...log, sets: newSets };
        }));
    };
    
    const handleAddSet = (tempId: string) => {
        setLoggedExercises(currentLogs => currentLogs.map(log => 
            log.tempId === tempId ? { ...log, sets: [...log.sets, {}] } : log
        ));
    };
    
    const handleDeleteSet = (tempId: string, setIndex: number) => {
        setLoggedExercises(currentLogs => currentLogs.map(log => {
            if (log.tempId !== tempId) return log;
            const newSets = [...log.sets];
            newSets.splice(setIndex, 1);
            return { ...log, sets: newSets };
        }));
    };

    const handleToggleSetComplete = (tempId: string, setIndex: number) => {
        setLoggedExercises(currentLogs => {
            const exerciseIndex = currentLogs.findIndex(l => l.tempId === tempId);
            if (exerciseIndex === -1) return currentLogs;
    
            const originalSet = originalPlanRef.current[exerciseIndex]?.sets[setIndex] || {};
            const exercise = exercises.find(e => e.id === currentLogs[exerciseIndex].exerciseId);
    
            return currentLogs.map(log => {
                if (log.tempId !== tempId) return log;
    
                const newSets = [...log.sets];
                const set = { ...newSets[setIndex] };
                const isNowCompleting = !set.completed;
                set.completed = isNowCompleting;
                
                if (isNowCompleting) {
                    const isCountType = exercise?.measurementType === MeasurementType.COUNT;
    
                    if (isCountType) {
                        if (set.reps === undefined) {
                            set.reps = originalSet.reps ?? originalSet.repsMin; 
                        }
                    } else { // Time-based
                        if (set.time === undefined) {
                            set.time = originalSet.time;
                        }
                    }
    
                    if (set.value === undefined) {
                        set.value = originalSet.value;
                    }
    
                    if (set.effort === undefined) {
                        set.effort = originalSet.effort;
                    }
                }
                
                newSets[setIndex] = set;
                return { ...log, sets: newSets };
            });
        });
    };

    const handleFinishWorkout = () => {
        const cleanedLoggedExercises = loggedExercises
            .map(log => {
                const { tempId, ...rest } = log; // Remove temporary ID
                return {
                    ...rest,
                    sets: rest.sets.filter(set => Object.values(set).some(v => v != null && v !== false && v !== ''))
                };
            })
            .filter(log => log.sets.length > 0);

        const isNewWorkout = activeWorkoutSession.id.startsWith('ws_temp_');
        const workoutDuration = elapsedTime;

        if (cleanedLoggedExercises.length === 0) {
            if (window.confirm("Nenhum exercício foi registrado. O treino não será salvo. Deseja continuar?")) {
                // If it was an existing workout from the calendar, we should delete it.
                if (!isNewWorkout) {
                    deleteWorkout(activeWorkoutSession.id);
                }
                // If it was a new workout, just closing is enough to discard it.
                setActiveWorkoutSession(null);
            }
            return; // Don't proceed to save
        }
        
        if (isNewWorkout) {
            const { id, ...sessionData } = activeWorkoutSession;
            const finalSession: Omit<WorkoutSession, 'id'> = {
                ...sessionData,
                loggedExercises: cleanedLoggedExercises,
                endTime: new Date().toISOString(),
                completed: true,
                duration: workoutDuration,
            };
            logWorkout(finalSession);
            setActiveWorkoutSession(null);
        } else {
            const updatedSession: WorkoutSession = {
                ...activeWorkoutSession,
                loggedExercises: cleanedLoggedExercises,
                endTime: new Date().toISOString(),
                completed: true,
                duration: workoutDuration,
            };
            updateWorkout(updatedSession);
        }
    };
    
    const handleCancelWorkout = () => {
        setIsCancelConfirmOpen(true);
    };

    const confirmAndCancelWorkout = () => {
        setActiveWorkoutSession(null);
        setIsCancelConfirmOpen(false);
    };

    return (
        <div className="h-full w-full bg-light-bg dark:bg-dark-bg flex flex-col font-sans">
            <header className="flex-shrink-0 bg-light-card dark:bg-dark-card h-16 flex items-center justify-between px-4">
                 <button onClick={handleCancelWorkout} className="p-2 flex items-center justify-center" aria-label="Voltar">
                    <ChevronLeftIcon className="h-6 w-6 text-light-text dark:text-dark-text" />
                </button>
                <div className="text-center">
                    <h1 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary -mb-1 truncate px-2">{routine.name}</h1>
                    <button
                        onClick={() => setIsTimerEditModalOpen(true)}
                        className="text-xl font-bold text-secondary tabular-nums p-1 rounded-md hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                        aria-label="Editar cronômetro"
                    >
                        <div aria-live="polite">
                            {formatDuration(elapsedTime)}
                        </div>
                    </button>
                </div>
                <button onClick={handleCancelWorkout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm whitespace-nowrap">
                    Cancelar
                </button>
            </header>
            <main className="flex-grow overflow-y-auto p-4 space-y-4 pb-24">
                {routine.notes && (
                    <div className="bg-light-card dark:bg-dark-card p-3 rounded-lg border-l-4" style={{borderColor: routine.color}}>
                        <h3 className="text-md font-semibold text-light-text dark:text-dark-text mb-1">Anotações da Rotina</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary italic">"{routine.notes}"</p>
                    </div>
                )}
                {loggedExercises.map((loggedEx, exIndex) => {
                    const exercise = exercises.find(e => e.id === loggedEx.exerciseId);
                    if (!exercise) return null;

                    const scaleOptions = getScaleOptions(exercise.perceivedExertionScale);
                    const exerciseSets = loggedEx.sets || [];
                    const setsToRender = exerciseSets.length > 0 ? exerciseSets : [{}];
                    return (
                        <div key={loggedEx.tempId} className="bg-light-card dark:bg-dark-card p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">{exercise.name}</h3>
                                <button type="button" onClick={() => handleRemoveExercise(loggedEx.tempId)} className="p-1 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500" aria-label={`Remover ${exercise.name} do treino`}>
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <textarea
                                value={loggedEx.notes || ''}
                                onChange={(e) => handleExerciseNoteChange(loggedEx.tempId, e.target.value)}
                                placeholder="Anotações do treino para este exercício..."
                                rows={2}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 text-sm mb-3"
                            />
                            
                            <div className="grid grid-cols-12 gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary font-bold mb-2 px-1">
                                <div className="col-span-1 text-center" title="Completado">✓</div>
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-2 text-center">{exercise.measurementType === MeasurementType.COUNT ? 'Reps' : 'Tempo (MM:SS)'}</div>
                                <div className="col-span-3 text-center">{exercise.unit !== Unit.NONE ? exercise.unit : ''}</div>
                                <div className="col-span-4 text-center">{scaleOptions ? "Esforço" : ""}</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-2">
                                {setsToRender.map((set, setIndex) => {
                                    // Get the corresponding original planned set for placeholders
                                    const originalSet = originalPlanRef.current[exIndex]?.sets[setIndex] || {};

                                    const isCountType = exercise.measurementType === MeasurementType.COUNT;
                                    
                                    // Define placeholders based on the original plan
                                    let repsTimePlaceholder = '';
                                    if (isCountType) {
                                        const plannedSingleRep = activeWorkoutSession?.completed ? set.reps : originalSet.reps;
                                        repsTimePlaceholder = (originalSet.repsMin !== undefined || originalSet.repsMax !== undefined)
                                            ? `${originalSet.repsMin ?? ''}-${originalSet.repsMax ?? ''}`
                                            : plannedSingleRep?.toString() ?? '';
                                    } else {
                                        const plannedTime = activeWorkoutSession?.completed ? set.time : originalSet.time;
                                        repsTimePlaceholder = formatSecondsToMMSS(plannedTime) || "MM:SS";
                                    }
                                    
                                    const valueFromPlan = activeWorkoutSession?.completed ? set.value : originalSet.value;
                                    const valuePlaceholder = valueFromPlan?.toString() ?? '';

                                    const effortFromPlan = activeWorkoutSession?.completed ? set.effort : originalSet.effort;
                                    
                                    return (
                                        <div key={setIndex} className={`grid grid-cols-12 gap-2 items-center transition-opacity ${set.completed ? 'opacity-50' : ''}`}>
                                            <div className="col-span-1 flex items-center justify-center">
                                                <input 
                                                    type="checkbox"
                                                    aria-label={`Marcar série ${setIndex + 1} como completa`}
                                                    checked={!!set.completed}
                                                    onChange={() => handleToggleSetComplete(loggedEx.tempId, setIndex)}
                                                    className="h-5 w-5 rounded text-secondary bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border focus:ring-secondary focus:ring-2 cursor-pointer"
                                                />
                                            </div>
                                            <div className={`col-span-1 flex items-center justify-center h-10 bg-light-bg dark:bg-dark-bg rounded-md font-bold text-light-text dark:text-dark-text ${set.completed ? 'line-through' : ''}`}>{setIndex + 1}</div>
                                            <div className="col-span-2">
                                                {isCountType ? (
                                                    <input 
                                                        type="number" 
                                                        inputMode="numeric"
                                                        aria-label={`Repetições para série ${setIndex + 1}`}
                                                        placeholder={repsTimePlaceholder}
                                                        value={set.reps ?? ''}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={e => handleSetChange(loggedEx.tempId, setIndex, 'reps', e.target.value)}
                                                        className={`w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 text-center text-light-text dark:text-dark-text transition-colors duration-300 ${set.completed ? 'line-through' : ''}`}
                                                    />
                                                ) : (
                                                    <TimeInput
                                                        id={`session-time-input-${loggedEx.tempId}-${setIndex}`}
                                                        valueInSeconds={set.time}
                                                        onChangeInSeconds={(seconds) => {
                                                            setLoggedExercises(currentLogs => currentLogs.map(log => {
                                                                if (log.tempId !== loggedEx.tempId) return log;
                                                                const newSets = [...log.sets];
                                                                const updatedSet = { ...(newSets[setIndex] || {}) };
                                                                updatedSet.time = seconds;
                                                                newSets[setIndex] = updatedSet;
                                                                return { ...log, sets: newSets };
                                                            }));
                                                        }}
                                                        placeholder={repsTimePlaceholder}
                                                        className={`w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 text-center text-light-text dark:text-dark-text transition-colors duration-300 ${set.completed ? 'line-through' : ''}`}
                                                    />
                                                )}
                                            </div>
                                            <div className="col-span-3">
                                                 {exercise.unit !== Unit.NONE &&
                                                    <input 
                                                        type="number" 
                                                        aria-label={`Peso para série ${setIndex + 1}`}
                                                        placeholder={valuePlaceholder}
                                                        value={set.value ?? ''}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={e => handleSetChange(loggedEx.tempId, setIndex, 'value', e.target.value)}
                                                        className={`w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 text-center text-light-text dark:text-dark-text transition-colors duration-300 ${set.completed ? 'line-through' : ''}`}
                                                    />
                                                 }
                                            </div>
                                            <div className="col-span-4">
                                                {scaleOptions && (
                                                    <div className="relative h-10 w-full">
                                                        <div 
                                                            className={`w-full h-full flex items-center justify-between bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md px-2 text-left text-sm transition-colors duration-300 pointer-events-none ${set.completed ? 'line-through' : ''} ${!set.effort ? 'text-light-text-secondary dark:text-dark-text-secondary' : 'text-light-text dark:text-dark-text'}`}
                                                        >
                                                            <span className="truncate">
                                                                {set.effort || (effortFromPlan ? `Sug: ${effortFromPlan}` : 'Selecionar...')}
                                                            </span>
                                                            <ChevronDownIcon className="h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary" />
                                                        </div>

                                                        <select
                                                            value={set.effort || ''}
                                                            onChange={e => handleSetChange(loggedEx.tempId, setIndex, 'effort', e.target.value)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            aria-label={`Esforço para série ${setIndex + 1}`}
                                                        >
                                                            <option value="">-</option>
                                                            {scaleOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button onClick={() => handleDeleteSet(loggedEx.tempId, setIndex)} className="p-2 flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500" aria-label={`Deletar série ${setIndex + 1}`}>
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            
                            <button onClick={() => handleAddSet(loggedEx.tempId)} className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md flex items-center justify-center">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Adicionar Série
                            </button>
                        </div>
                    );
                })}
                 <button 
                    type="button" 
                    onClick={() => setIsExercisePickerOpen(true)} 
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Adicionar Exercício
                </button>
                <button 
                    onClick={handleFinishWorkout} 
                    className="w-full mt-4 bg-secondary hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center text-lg"
                >
                    <CheckCircleIcon className="h-6 w-6 mr-2" />
                    Concluir Treino
                </button>
            </main>
            {isExercisePickerOpen && (
                <ExercisePickerModal 
                    onClose={() => setIsExercisePickerOpen(false)}
                    onSelect={handleAddExercise}
                    allExercises={exercises}
                    selectedIds={loggedExercises.map(p => p.exerciseId)}
                />
            )}
            {isCancelConfirmOpen && (
                <ConfirmationModal
                    isOpen={isCancelConfirmOpen}
                    onClose={() => setIsCancelConfirmOpen(false)}
                    onConfirm={confirmAndCancelWorkout}
                    title="Cancelar Treino"
                    message="Tem certeza que deseja cancelar o treino? O progresso não salvo será perdido."
                    confirmText="Sim"
                    cancelText="Não"
                />
            )}
            {isTimerEditModalOpen && (
                <TimerEditModal
                    isOpen={isTimerEditModalOpen}
                    onClose={() => setIsTimerEditModalOpen(false)}
                    onSave={(newTime) => setElapsedTime(newTime)}
                    initialTime={elapsedTime}
                />
            )}
        </div>
    );
};

interface TimerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newTimeInSeconds: number) => void;
    initialTime: number;
}

const TimerEditModal: React.FC<TimerEditModalProps> = ({ isOpen, onClose, onSave, initialTime }) => {
    const [newTime, setNewTime] = useState<number | undefined>(initialTime);

    if (!isOpen) return null;

    const handleSave = () => {
        if (newTime !== undefined) {
            onSave(newTime);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-lg p-6 w-full max-w-sm text-light-text dark:text-dark-text">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Editar Cronômetro</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full flex items-center justify-center hover:bg-light-bg dark:hover:bg-dark-bg">
                        <XIcon className="h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="timer-edit-input" className="block text-sm font-medium mb-1">Novo tempo (MM:SS)</label>
                        <TimeInput
                            id="timer-edit-input"
                            valueInSeconds={newTime}
                            onChangeInSeconds={setNewTime}
                            placeholder="00:00"
                            className="w-full text-center text-2xl font-bold bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2"
                        />
                    </div>
                    <div className="pt-2 flex justify-end items-center space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-md">Cancelar</button>
                        <button type="button" onClick={handleSave} className="bg-secondary hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-md">Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface ExercisePickerModalProps {
    onClose: () => void;
    onSelect: (exerciseId: string) => void;
    allExercises: Exercise[];
    selectedIds: string[];
}

const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({ onClose, onSelect, allExercises, selectedIds }) => {
     const exercisesByCategory = useMemo(() => {
        return allExercises.reduce((acc, exercise) => {
            if (!acc[exercise.category]) acc[exercise.category] = [];
            acc[exercise.category].push(exercise);
            return acc;
        }, {} as Record<ExerciseCategory, Exercise[]>);
    }, [allExercises]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col text-light-text dark:text-dark-text">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Selecionar Exercício</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full flex items-center justify-center hover:bg-light-bg dark:hover:bg-dark-bg"><XIcon className="h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary" /></button>
                </div>
                <div className="overflow-y-auto space-y-3">
                    {Object.entries(exercisesByCategory).map(([category, exercises]) => (
                        <div key={category}>
                            <h4 className="font-semibold text-light-text-secondary dark:text-dark-text-secondary mt-2 sticky top-0 bg-light-card dark:bg-dark-card py-1">{category}</h4>
                            {exercises.map(ex => {
                                // In a workout, we might want to add the same exercise multiple times.
                                // The selectedIds prop is used here just for visual feedback (check mark).
                                const isSelected = selectedIds.includes(ex.id);
                                return (
                                <button
                                    key={ex.id}
                                    onClick={() => onSelect(ex.id)}
                                    className={'w-full text-left p-3 rounded-md flex items-center hover:bg-light-bg dark:hover:bg-dark-bg'}
                                >
                                    {isSelected ? 
                                        <CheckCircleIcon className="h-5 w-5 mr-3 flex-shrink-0 text-primary"/> :
                                        <div className={'h-5 w-5 mr-3 flex-shrink-0 rounded-full border-2 border-light-text-secondary dark:border-dark-text-secondary'}></div>
                                    }
                                    <span>{ex.name}</span>
                                </button>
                            )})}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkoutSessionScreen;
