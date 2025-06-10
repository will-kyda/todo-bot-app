// 1. IMPORTER LES MODULES
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const config = require('./config'); // Notre fichier de config

// 2. CRÉER L'APPLICATION EXPRESS
const app = express();

// 3. CONFIGURER LE PARSING JSON
// Permet de comprendre les données JSON envoyées par React
app.use(express.json());
// CONFIGURER CORS pour permettre à React de communiquer
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// 4. CRÉER LE BOT TELEGRAM
const bot = new TelegramBot(config.TELEGRAM_TOKEN, { polling: false });

// 5. VARIABLE POUR STOCKER LES TÂCHES
// Pour l'instant, on stocke en mémoire (simple mais temporaire)
let scheduledTasks = [];

// 6. ROUTE DE TEST
// Une URL pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend Todo fonctionne !', 
    time: new Date().toISOString() 
  });
});

// 7. ROUTE DE TEST TELEGRAM
// URL pour tester l'envoi d'un message
app.get('/test-telegram', async (req, res) => {
  try {
    // Envoyer un message de test
    await bot.sendMessage(config.CHAT_ID, '🤖 Test réussi ! Votre bot fonctionne parfaitement !');
    
    res.json({ 
      success: true, 
      message: 'Message envoyé sur Telegram !' 
    });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 8. ROUTE PRINCIPALE - Recevoir les tâches de React
app.post('/schedule-task', (req, res) => {
  try {
    // Récupérer les données envoyées par React
    const { task, outputPrecis, startTime, endTime, etapesIntermediaires, recevoirMessage } = req.body;
    
    console.log('📝 Nouvelle tâche reçue:', task);
    console.log('⏰ Début:', startTime);
    console.log('🏁 Fin:', endTime);
    
    // Convertir les dates string en objets Date
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();
    
    // Vérifier que les dates sont dans le futur
    if (startDate <= now) {
      return res.json({ 
        success: false, 
        error: 'La date de début doit être dans le futur' 
      });
    }
    
    // Créer l'objet tâche complet
    const taskData = {
      id: Date.now(),
      task,
      outputPrecis,
      startTime,
      endTime,
      etapesIntermediaires,
      recevoirMessage,
      startDate,
      endDate,
      startSent: false,
      endSent: false
    };
    
    // Stocker la tâche
    scheduledTasks.push(taskData);
    
    console.log(`✅ Tâche programmée ! Total: ${scheduledTasks.length} tâches`);
    
    res.json({ 
      success: true, 
      message: 'Tâche programmée avec succès !',
      taskId: taskData.id
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 9. ROUTE POUR VOIR LES TÂCHES PROGRAMMÉES
app.get('/tasks', (req, res) => {
  res.json({
    success: true,
    tasks: scheduledTasks,
    count: scheduledTasks.length
  });
});

// 10. FONCTIONS POUR CRÉER LES MESSAGES TELEGRAM
function createStartMessage(taskData) {
  // Titre principal : Output si disponible, sinon Task
  const titre = taskData.outputPrecis && taskData.outputPrecis.trim() 
    ? taskData.outputPrecis 
    : taskData.task;
  
  let message = `${titre}\n`;
  
  // DDL uniquement si endTime existe
  if (taskData.endTime) {
    const endDate = new Date(taskData.endTime);
    const endFormatted = endDate.toLocaleString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    message += `Deadline: ${endFormatted}\n`;
    
    // Duration calculée si deadline
    const startDate = new Date(taskData.startTime);
    const durationMs = endDate - startDate;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (durationHours > 0 || durationMinutes > 0) {
      message += `Duration: ${durationHours}h ${durationMinutes}min\n`;
    }
  }
  
  // Étapes si elles existent
  if (taskData.etapesIntermediaires && taskData.etapesIntermediaires.length > 0) {
    const etapesText = taskData.etapesIntermediaires
      .filter(etape => etape.trim() !== '')
      .join(', ');
    if (etapesText) {
      message += `Steps: ${etapesText}\n`;
    }
  }
  
  message += `\nGo!`;
  
  return message;
}

function createEndMessage(taskData) {
  // Titre principal : Output si disponible, sinon Task
  const titre = taskData.outputPrecis && taskData.outputPrecis.trim() 
    ? taskData.outputPrecis 
    : taskData.task;
  
  return `🔴 End of Deadline for: ${titre}`;
}

// 11. SYSTÈME DE SCHEDULING AUTOMATIQUE
// Vérifie toutes les minutes s'il faut envoyer des messages
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  
  console.log(`🕐 Vérification automatique: ${currentMinute.toLocaleTimeString('fr-FR')}`);
  
  // Parcourir toutes les tâches programmées
  for (let taskData of scheduledTasks) {
    const startMinute = new Date(taskData.startDate.getFullYear(), taskData.startDate.getMonth(), 
                                taskData.startDate.getDate(), taskData.startDate.getHours(), taskData.startDate.getMinutes());
    
    const endMinute = new Date(taskData.endDate.getFullYear(), taskData.endDate.getMonth(), 
                              taskData.endDate.getDate(), taskData.endDate.getHours(), taskData.endDate.getMinutes());
    
    // Vérifier si c'est l'heure de début ET qu'on n'a pas déjà envoyé
    if (currentMinute.getTime() === startMinute.getTime() && !taskData.startSent) {
      try {
        console.log(`📤 Envoi message de début pour: ${taskData.task}`);
        await bot.sendMessage(config.CHAT_ID, createStartMessage(taskData));
        taskData.startSent = true; // Marquer comme envoyé
        console.log(`✅ Message de début envoyé !`);
      } catch (error) {
        console.error(`❌ Erreur envoi message début:`, error.message);
      }
    }
    
    // Vérifier si c'est l'heure de fin ET qu'on n'a pas déjà envoyé
    if (currentMinute.getTime() === endMinute.getTime() && !taskData.endSent && taskData.recevoirMessage) {
      try {
        console.log(`📤 Envoi message de fin pour: ${taskData.task}`);
        await bot.sendMessage(config.CHAT_ID, createEndMessage(taskData));
        taskData.endSent = true; // Marquer comme envoyé
        console.log(`✅ Message de fin envoyé !`);
      } catch (error) {
        console.error(`❌ Erreur envoi message fin:`, error.message);
      }
    }
  }
});

// Message de confirmation du scheduling
console.log('⏰ Système de scheduling activé - vérification chaque minute');

// 12. DÉMARRER LE SERVEUR
app.listen(config.PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${config.PORT}`);
  console.log(`📱 Bot Telegram connecté`);
  console.log(`🌐 Testez sur: http://localhost:${config.PORT}`);
});