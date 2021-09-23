const technonameField = document.querySelector('#techno-name');
const technoDescriptionField = document.querySelector('#techno-description');
const technoUrlField = document.querySelector('#techno-url');
const addTechnoForm = document.querySelector('#add-techno-form');

addTechnoForm.addEventListener('submit', evt => {
    evt.preventDefault();
    
    const payload = {
        id: Date.now() + "",
        name: technonameField.value,
        description: technoDescriptionField.value,
        url: technoUrlField.value
    }

    fetch('https://us-central1-pwa-technos-yasmine.cloudfunctions.net/addTechno', { 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(resp => {
            console.log(resp);
        })
        // 9.5 Ajouter les données en local lors de la déconnexion
  // Hors ligne le POST échoue
  .catch(() => {
    // test si service worker ET "syncManager" existent
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      console.log('SyncManager supported by browser');
      console.log('we are probably offline');
      navigator.serviceWorker.ready.then(registration => {
        // API entre en action lors de la déconnexion puis reconnexion
        // put techno pour sauvegarder en local dans IndexedDB
        return putTechno(payload, payload.id).then(() => {
          // Tague le service de synchronisation pour l'utiliser après
            console.log("SYNC sync-technos");
            return registration.sync.register('sync-technos');
        });
      })
    } else {
        // TODO browser does NOT support SyncManager: send data to server via ajax
        console.log('SyncManager NOT supported by your browser');
      }
  })
  .then(() => {
    clearForm();
  })
  .catch(error => console.error(error));

  // 9.5 Ajouter les données en local lors de la déconnexion
  // Vide le formulaire
  const clearForm = () => {
    technonameField.value = '';
    technoDescriptionField.value = '';
    technoUrlField.value = '';
    technonameField.focus();
  }; 
})
	
// 9.6 Synchroniser les données au retour de la connexion
// Ajout des imports pour les appels méthodes hors connexion
self.importScripts('idb/idb.js', 'idb/database.js');
 
// ..
 
 
// 9.6 Synchroniser les données au retour de la connexion
self.addEventListener('sync', event => {
    console.log('sync event', event);
    // test du tag de synchronisation utilisé dans add_techno
    if (event.tag === 'sync-technos') {
        console.log('syncing', event.tag);
        // Utilisation de waitUntil pour s'assurer que le code est exécuté (Attend une promise)
        event.waitUntil(updateTechnoPromise);
    }
})
 
// 9.6 Synchroniser les données au retour de la connexion
// constante de la Promise permettant de faire la synchronisation
const updateTechnoPromise = new Promise(function(resolve, reject) {
 
  // récupération de la liste des technos de indexedDB
  getAllTechnos().then(technos => {
      console.log('got technos from sync callback', technos);
      
      // pour chaque item : appel de l'api pour l'ajouter à la base
      technos.map(techno => {
          console.log('Attempting fetch', techno);
          fetch('https://{ VOTRE URL DE PROJET FIREBASE }.cloudfunctions.net/addTechno', {
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              },
              method: 'POST',
              body: JSON.stringify(techno)
          })
          .then(() => {
              // Succès : suppression de l'item en local si ajouté en distant
              console.log('Success update et id supprimée', techno.id);
              return deleteTechno(techno.id);
          })
          .catch(err => {
              // Erreur
              console.log('Error update et id supprimée', err);
              resolve(err);
          })
      })

  })
});
