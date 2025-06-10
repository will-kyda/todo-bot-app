import React, { useState } from 'react';
import logo from './assets/logo.svg?react';

function App() {
  const [task, setTask] = useState('');
  const [currentScreen, setCurrentScreen] = useState('input'); // 'input', 'questions', 'recap'
  
  // États pour les réponses du second menu
  const [outputPrecis, setOutputPrecis] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [etapesIntermediaires, setEtapesIntermediaires] = useState(['', '']); // Array d'étapes
  const [recevoirMessage, setRecevoirMessage] = useState(false);
  
  // État pour stocker toutes les tâches
  const [tachesCompletes, setTachesCompletes] = useState([]);

  const handleSubmit = () => {
    if (task.trim()) {
      console.log('Lancer algorithme pour:', task);
      setCurrentScreen('questions');
    }
  };

  const handleBack = () => {
    setCurrentScreen('input');
  };

  const handleVoirTaches = () => {
    setCurrentScreen('recap');
  };

  // Fonctions pour gérer les étapes intermédiaires
  const addEtape = () => {
    setEtapesIntermediaires([...etapesIntermediaires, '']);
  };

  const removeEtape = () => {
    if (etapesIntermediaires.length > 1) {
      setEtapesIntermediaires(etapesIntermediaires.slice(0, -1));
    }
  };

  const updateEtape = (index, value) => {
    const newEtapes = [...etapesIntermediaires];
    newEtapes[index] = value;
    setEtapesIntermediaires(newEtapes);
  };

  const handleFinalSubmit = async () => {
    try {
      // Préparer les données à envoyer
      const taskData = {
        task,
        outputPrecis,
        startTime,
        endTime,
        etapesIntermediaires: etapesIntermediaires.filter(etape => etape.trim() !== ''),
        recevoirMessage
      };

      console.log('📤 Envoi vers le backend:', taskData);

      // Envoyer vers le backend
      const response = await fetch('https://todo-bot-backend.onrender.com/schedule-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });

      const result = await response.json();
      console.log('📥 Réponse du backend:', result);

      if (result.success) {
        // Succès ! Ajouter à la liste locale et aller au récap
        const nouvelleTache = {
          id: result.taskId || Date.now(),
          ...taskData
        };
        
        setTachesCompletes([...tachesCompletes, nouvelleTache]);
        setCurrentScreen('recap');
        
        alert('✅ Tâche programmée avec succès ! Vous recevrez les notifications sur Telegram.');
      } else {
        // Erreur du backend
        alert('❌ Erreur: ' + result.error);
      }

    } catch (error) {
      console.error('❌ Erreur de communication:', error);
      alert('❌ Erreur de communication avec le serveur. Vérifiez que le backend est démarré.');
    }
  };

  const handleAjouterNouvelleTache = () => {
    // Réinitialiser les champs et retourner au premier écran
    setTask('');
    setOutputPrecis('');
    setStartTime('');
    setEndTime('');
    setEtapesIntermediaires(['', '']);
    setRecevoirMessage(false);
    setCurrentScreen('input');
  };

  // Écran 1: Saisie de la tâche
  if (currentScreen === 'input') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="pt-20">
          <div className="text-center">
            <img src={logo} alt="TodoBot" className="w-16 h-16 mx-auto mb-2" />
            <h1 className="text-center text-5xl font-bold text-[#004BAD]">
            TodoBot
            </h1>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center -mt-80">
          <div className="text-center space-y-6">
            <p className="text-xl text-gray-600 mb-4">
              What is your task?
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter task name "
                className="w-80 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-[#004BAD] focus:outline-none"
              />
              
              <button
                onClick={handleSubmit}
                disabled={!task.trim()}
                className="block mx-auto px-6 py-3 text-lg font-medium text-white bg-[#FEBE58] hover:bg-[#004BAD] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer active:bg-[#004BAD]"
              >
                Construct Task
              </button>
              
              {/* Bouton pour voir les tâches planifiées */}
              {tachesCompletes.length > 0 && (
                <button
                  onClick={handleVoirTaches}
                  className="block mx-auto px-4 py-2 text-sm font-medium text-blue-500 border-2 border-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Voir mes {tachesCompletes.length} tâche(s) planifiée(s)
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Écran 3: Récapitulatif des tâches
  if (currentScreen === 'recap') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="pt-10">
          <h1 className="text-center text-3xl font-bold text-[#004BAD]">
            To-do-bot
          </h1>
        </header>
        
        <main className="flex-1 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Récapitulatif de vos tâches
              </h2>
              <p className="text-gray-600">
                {tachesCompletes.length} tâche(s) planifiée(s)
              </p>
            </div>

            {/* Tableau des tâches */}
            <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Tâche</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Output précis</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Start Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">End Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Étapes</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {tachesCompletes.map((tache, index) => (
                    <tr key={tache.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-800 border-b">
                        {tache.task}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b">
                        {tache.outputPrecis || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b">
                        {tache.startTime || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b">
                        {tache.endTime || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b">
                        {tache.etapesIntermediaires.length > 0 
                          ? tache.etapesIntermediaires.join(', ') 
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm border-b">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          tache.recevoirMessage 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tache.recevoirMessage ? 'Oui' : 'Non'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bouton pour ajouter une nouvelle tâche */}
            <div className="text-center">
              <button
                onClick={handleAjouterNouvelleTache}
                className="px-8 py-3 text-lg font-medium text-white bg-[#004BAD] hover:bg-blue-600 rounded-lg transition-colors"
              >
                + Ajouter une nouvelle tâche
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Écran 2: Questions détaillées
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="pt-10">
        <h1 className="text-center text-3xl font-bold text-[#004BAD]">
          To-do-bot
        </h1>
      </header>
      
      <main className="flex-1 flex items-center justify-center pt-3">
        <div className="w-full max-w-2xl px-6">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600 mb-1">
              Selected Task:
            </p>
            <p className="text-2xl font-bold text-[#FEBE58]">
              {task}
            </p>
          </div>

          <div className="space-y-6">
            {/* Question 1: Output précis */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">
                Desired output?
              </label>
              <input
                type="text"
                value={outputPrecis}
                onChange={(e) => setOutputPrecis(e.target.value)}
                placeholder="Ex: 10 pages pdf rapport..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-[#004BAD] focus:outline-none"
              />
            </div>

            {/* Question 2: Date de début */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Starting date?
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-[#004BAD] focus:outline-none"
              />
            </div>

            {/* Question 3: Date de fin */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Deadline?
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-[#004BAD] focus:outline-none"
              />
            </div>

            {/* Question 4: Étapes intermédiaires */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-lg font-medium text-gray-700">
                  Sub-steps?
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={removeEtape}
                    disabled={etapesIntermediaires.length <= 1}
                    className="w-8 h-8 flex items-center justify-center text-lg font-bold text-white bg-red-400 hover:bg-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed rounded transition-colors"
                  >
                    −
                  </button>
                  <button
                    onClick={addEtape}
                    className="w-8 h-8 flex items-center justify-center text-lg font-bold text-white bg-green-500 hover:bg-green-600 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {etapesIntermediaires.map((etape, index) => (
                  <input
                    key={index}
                    type="text"
                    value={etape}
                    onChange={(e) => updateEtape(index, e.target.value)}
                    placeholder={`Step ${index + 1} : Ex: Research, planning...`}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-[#004BAD] focus:outline-none"
                  />
                ))}
              </div>
            </div>

            {/* Question 5: Toggle message */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <span className="text-lg font-medium text-gray-700">
                  Do you want a bot reminder message?
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={recevoirMessage}
                    onChange={(e) => setRecevoirMessage(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${recevoirMessage ? 'bg-[#004BAD]' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${recevoirMessage ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`}></div>
                  </div>
                </div>
              </label>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-4 pt-6 pb-4">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 text-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                ← Back
              </button>
              
              <button
                onClick={handleFinalSubmit}
                className="flex-1 px-6 py-3 text-lg font-medium text-white bg-black hover:bg-blue-300 rounded-lg transition-colors active:bg-[#004BAD]"
              >
                Validate
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;