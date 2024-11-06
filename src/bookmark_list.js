document.addEventListener('DOMContentLoaded', async function () {
    const bookmarkList = document.getElementById('bookmark-list');
    const bookmarkCountElement = document.getElementById('bookmark-count');
    const loadingIndicator = document.getElementById('loading-indicator');
    let bookmarkCount = 0;
    const bookmarksJSON = [];

    // Fonction pour récupérer les balises méta d'une URL
    async function fetchMetaTags(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'text/html'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const metaTags = doc.getElementsByTagName('meta');

            const metaInfo = {
                title: [],
                description: [],
                type: [],
                keywords: [],
                author: []
            };

            const propertyMappings = {
                'description': 'description',
                'title': 'title',
                'type': 'type',
                'author': 'author',
                'keywords': 'keywords',
                'creator': 'author'
            };

            // Convertir la collection HTMLCollection en tableau pour utiliser forEach
            Array.from(metaTags).forEach(metaTag => {
                const nameAttribute = metaTag.getAttribute('name');
                const propertyAttribute = metaTag.getAttribute('property');
                const content = metaTag.getAttribute('content');

                if (content) {
                    if (nameAttribute) {
                        switch (nameAttribute) {
                            case 'description':
                            case 'keywords':
                            case 'author':
                            case 'title':
                            case 'type':
                                metaInfo[nameAttribute].push(content);
                                break;
                        }
                    }

                    if (propertyAttribute) {
                        // Utiliser une fonction fléchée pour plus de concision
                        Object.entries(propertyMappings).forEach(([key, value]) => {
                            if (propertyAttribute.includes(key)) {
                                metaInfo[value].push(content);
                            }
                        });
                    }
                }
            });

            // Récupérer le titre de la page
            const title = doc.title || "No title available";
            metaInfo.title.push(title);
            return metaInfo;
        } catch (error) {
            console.error('Error fetching meta tags:', error);
            return {
                title: ["No information available"],
                description: [],
                type: [],
                keywords: [],
                author: []
            };
        }
    }

    // Fonction pour parcourir l'arbre des marque-pages
    async function traverseBookmarks(node) {
        if (node.url) {
            bookmarksJSON.push(node);
            bookmarkCount++;
        }
        if (node.children) {
            for (const child of node.children) {
                await traverseBookmarks(child);
            }
        }
    }

    // Récupérer tous les marque-pages
    const bookmarkTree = await browser.bookmarks.getTree();
    for (const root of bookmarkTree) {
        await traverseBookmarks(root);
    }

    // Afficher le nombre total de marque-pages
    bookmarkCountElement.textContent = `Total bookmarks: ${bookmarkCount}`;

    // Afficher l'indicateur de chargement
    loadingIndicator.style.display = 'block';

    // Afficher les marque-pages dans la liste
    for (const bookmark of bookmarksJSON) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = bookmark.url;
        a.textContent = bookmark.title;
        a.target = "_blank";
        li.appendChild(a);

        // Ajouter un élément details pour afficher les informations méta
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = "Show meta information";
        details.appendChild(summary);

        // Ajouter un paragraphe pour afficher les informations méta
        const metaContent = document.createElement('p');
        metaContent.textContent = "Loading meta information...";
        metaContent.style.fontSize = '14px';
        metaContent.style.color = '#666';
        details.appendChild(metaContent);

        li.appendChild(details);
        bookmarkList.appendChild(li);

        // Récupérer les informations des balises méta pour chaque marque-page
        const metaInfo = await fetchMetaTags(bookmark.url);

        // Mettre à jour le contenu des informations méta
        metaContent.textContent = Object.entries(metaInfo)
            .map(([key, values]) => `${key}: ${values.join(', ')}`)
            .join('\n');

        // Ajouter les informations au tableau JSON
        bookmark.metaInfo = metaInfo;
    }

    // Cacher l'indicateur de chargement une fois que toutes les marque-pages sont affichées
    loadingIndicator.style.display = 'none';

    // Afficher le JSON dans la console (pour le débogage)
    console.log(JSON.stringify(bookmarksJSON, null, 2));
});