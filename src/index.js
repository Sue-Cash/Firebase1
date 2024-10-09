// Affiche un message dans la console pour indiquer que l'application a démarré avec nodemon
console.log("Started with nodemon !");

// Importation des fonctions nécessaires depuis les SDK Firebase
import { initializeApp } from "firebase/app"; // Initialise l'application Firebase
import { 
  getFirestore, // Obtient une instance de Firestore
  collection, // Référence une collection dans Firestore
  getDocs, // Récupère tous les documents d'une collection
  addDoc, // Ajoute un nouveau document à une collection
  onSnapshot, // Écoute les mises à jour en temps réel d'une collection ou d'un document
  doc, // Référence un document spécifique dans Firestore
  deleteDoc, // Supprime un document de Firestore
  getDoc, // Récupère un document spécifique
  updateDoc // Met à jour un document existant
} from "firebase/firestore";

// Configuration de Firebase avec les clés et identifiants spécifiques à votre projet
const firebaseConfig = {
  apiKey: process.env.apiKey ,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId:process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId:process.env.measurementId 
};

// Initialise l'application Firebase avec la configuration spécifiée
const app = initializeApp(firebaseConfig);

// Obtient une instance de Firestore à partir de l'application Firebase initialisée
const db = getFirestore(app);

// Fonction pour écouter et récupérer les factures en temps réel depuis Firestore
function listenToFactures(db) {
  // Référence la collection "factures" dans Firestore
  const facturesCollection = collection(db, "factures");

  // Met en place un écouteur en temps réel sur la collection "factures"
  onSnapshot(facturesCollection, (facturesSnapshot) => {
    let factures = []; // Tableau pour stocker les factures récupérées

    // Itère sur chaque document dans le snapshot et ajoute les données au tableau
    facturesSnapshot.docs.map((doc) => {
      factures.push({ ...doc.data(), id: doc.id }); // Ajoute les données du document et son ID
    });

    // Appelle la fonction pour afficher les factures dans l'interface utilisateur
    displayFactures(factures);
  });
}

// Fonction pour afficher les factures sous forme de tableau avec des boutons pour éditer et supprimer
function displayFactures(factures) {
  // Sélectionne l'élément HTML avec l'ID "idFacture" où le tableau sera inséré
  const factureList = document.querySelector("#idFacture");
  
  // Crée le structure de base du tableau HTML pour afficher les factures
  factureList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Numéro</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>
  `;
  
  // Sélectionne le corps du tableau où les lignes de factures seront ajoutées
  const tableBody = factureList.querySelector("tbody");

  // Parcourt chaque facture et crée une ligne dans le tableau
  factures.forEach(facture => {
    // Formate la date de création de la facture ou affiche un message si la date n'est pas disponible
    const date = facture.createdAt ? facture.createdAt.toDate().toLocaleDateString() : "Date non disponible";
    
    // Crée un nouvel élément de ligne de tableau
    const row = document.createElement("tr");

    // Définit le contenu HTML de la ligne avec les données de la facture et les boutons d'action
    row.innerHTML = `
      <td>${facture.number}</td>
      <td>${facture.status}</td>
      <td>${date}</td>
      <td>
        <button class="edit-btn" data-id="${facture.id}">Edit</button>
        <button class="delete-btn" data-id="${facture.id}">Delete</button>
      </td>
    `;

    // Ajoute la ligne au corps du tableau
    tableBody.appendChild(row);
  });

  // Ajout des événements pour les boutons "Éditer"
  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", (e) => {
      const id = e.target.dataset.id; // Récupère l'ID de la facture depuis l'attribut data-id
      editFacture(id); // Appelle la fonction pour éditer la facture correspondante
    });
  });

  // Ajout des événements pour les boutons "Supprimer"
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", async (e) => {
      const id = e.target.dataset.id; // Récupère l'ID de la facture depuis l'attribut data-id
      await deleteDoc(doc(db, "factures", id)); // Supprime le document correspondant dans Firestore
      console.log("Facture supprimée avec succès !"); // Affiche un message de confirmation dans la console
    });
  });
}

// Écoute l'événement de soumission du formulaire d'édition de facture (ajouté une seule fois)
document.querySelector("#editFactureForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Empêche le comportement par défaut du formulaire (rechargement de la page)
  
  // Récupère l'ID de la facture stocké dans l'attribut data-id du formulaire
  const id = document.querySelector("#editFactureForm").dataset.id;
  
  // Référence le document spécifique de la facture dans Firestore
  const factureRef = doc(db, "factures", id);
  
  // Récupère les valeurs mises à jour depuis les champs du formulaire
  const updatedNumber = document.querySelector("#editNumber").value;
  const updatedStatus = document.querySelector("#editStatus").value;

  // Vérifie que tous les champs requis sont remplis correctement
  if (!updatedNumber || !updatedStatus || updatedStatus === "Choisissez un status") {
    alert("Veuillez remplir tous les champs correctement.");
    return; // Sort de la fonction si les validations échouent
  }

  try {
    // Met à jour le document de la facture dans Firestore avec les nouvelles valeurs
    await updateDoc(factureRef, {
      number: updatedNumber,
      status: updatedStatus,
    });

    console.log("Facture mise à jour avec succès !"); // Affiche un message de confirmation dans la console
    document.querySelector("#editForm").style.display = "none"; // Masque le formulaire d'édition après la mise à jour
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la facture : ", error); // Affiche l'erreur dans la console en cas de problème
  }
});

// Fonction pour éditer une facture spécifique
async function editFacture(id) {
  try {
    // Référence le document spécifique de la facture dans Firestore
    const factureRef = doc(db, "factures", id);
    
    // Récupère le snapshot du document de la facture
    const factureSnap = await getDoc(factureRef);

    // Vérifie si le document de la facture existe
    if (factureSnap.exists()) {
      const factureData = factureSnap.data(); // Récupère les données de la facture
      
      // Remplit les champs du formulaire d'édition avec les données de la facture
      document.querySelector("#editNumber").value = factureData.number;
      document.querySelector("#editStatus").value = factureData.status;
      
      // Stocke l'ID de la facture dans l'attribut data-id du formulaire pour utilisation lors de la soumission
      document.querySelector("#editFactureForm").dataset.id = id;

      // Affiche le formulaire d'édition
      document.querySelector("#editForm").style.display = "block";
    } else {
      console.log("Aucune facture trouvée avec cet ID."); // Message si aucune facture n'est trouvée
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la facture : ", error); // Affiche l'erreur en cas de problème lors de la récupération
  }
}

// Écoute l'événement de soumission du formulaire d'ajout de nouvelle facture
document.querySelector("#addFacture").addEventListener('submit', async (event) => {
  event.preventDefault(); // Empêche le comportement par défaut du formulaire (rechargement de la page)

  console.log("Submit add facture"); // Affiche un message dans la console pour indiquer que le formulaire a été soumis

  // Récupère les valeurs des champs du formulaire d'ajout de facture
  const number = document.querySelector("#number").value;
  const status = document.querySelector("#status").value;

  // Vérifie que tous les champs requis sont remplis correctement
  if (!number || !status || status === "Choisissez un status") {
    alert("Veuillez remplir tous les champs correctement.");
    return; // Sort de la fonction si les validations échouent
  }

  try {
    // Référence la collection "factures" dans Firestore
    const facturesCollection = collection(db, "factures");
    
    // Ajoute un nouveau document à la collection "factures" avec les données fournies
    await addDoc(facturesCollection, {
      number: number,
      status: status,
      createdAt: new Date() // Enregistre la date et l'heure de création
    });

    console.log("Facture ajoutée avec succès !"); // Affiche un message de confirmation dans la console
    
  } catch (error) {
    console.error("Erreur lors de l'ajout de la facture : ", error); // Affiche l'erreur en cas de problème lors de l'ajout
  }
});

// Appel initial lors du chargement de la fenêtre pour écouter et afficher les factures en temps réel
window.onload = () => {
  listenToFactures(db); // Démarre l'écoute des mises à jour de la collection "factures"
};

/*
Explications supplémentaires :
Initialisation de Firebase :

initializeApp : Cette fonction initialise votre application Firebase avec les configurations spécifiques de votre projet. Assurez-vous que les informations dans firebaseConfig sont correctes et sécurisées.
getFirestore : Après l'initialisation de l'application Firebase, cette fonction obtient une instance de Firestore, qui est la base de données NoSQL de Firebase.
Fonction listenToFactures :

Cette fonction met en place un écouteur en temps réel sur la collection "factures". Chaque fois qu'il y a une modification (ajout, suppression, mise à jour), le callback est exécuté, mettant à jour l'affichage des factures dans l'interface utilisateur.
Fonction displayFactures :

Prend un tableau de factures et les affiche dans un tableau HTML. Pour chaque facture, elle crée une ligne avec les détails et des boutons pour éditer ou supprimer la facture.
Gestion des événements des boutons "Edit" et "Delete" :

Edit : Lorsque le bouton "Edit" est cliqué, il appelle la fonction editFacture avec l'ID de la facture pour permettre à l'utilisateur de modifier les détails.
Delete : Lorsque le bouton "Delete" est cliqué, il supprime la facture correspondante de Firestore et affiche un message de confirmation.
Formulaire d'édition de facture :

Lors de la soumission du formulaire d'édition, la fonction empêche le rechargement de la page, récupère les valeurs mises à jour, valide les entrées, puis met à jour le document correspondant dans Firestore.
Formulaire d'ajout de nouvelle facture :

Lors de la soumission du formulaire d'ajout, la fonction empêche le rechargement de la page, récupère les valeurs saisies, valide les entrées, puis ajoute un nouveau document à la collection "factures" avec les données fournies.
Chargement initial de la fenêtre :

Lors du chargement de la fenêtre (window.onload), la fonction listenToFactures est appelée pour commencer à écouter les mises à jour en temps réel des factures et les afficher dans l'interface utilisateur.
Recommandations :
Sécurité des Clés API : Assurez-vous que vos clés API Firebase ne sont pas exposées publiquement, surtout si elles sont utilisées dans une application front-end. Utilisez des règles de sécurité Firestore appropriées pour protéger vos données.

Gestion des Erreurs : Bien que des blocs try-catch soient déjà en place, envisagez d'ajouter des mécanismes plus robustes pour informer l'utilisateur en cas d'erreurs, par exemple en affichant des messages d'erreur dans l'interface utilisateur plutôt que dans la console.

Optimisation de l'Interface Utilisateur : Pour une meilleure expérience utilisateur, vous pouvez ajouter des indicateurs de chargement lors des opérations asynchrones et améliorer le design des formulaires et des tableaux.
*/