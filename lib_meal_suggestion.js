export const processMealSuggestion = () => {
    const mealSuggestionDiv = document.querySelector('#mealSuggestion');
    mealSuggestionDiv.innerHTML = '<p>Loading meal suggestion...</p>';

    // Generate random ID between 1 and 50
    const randomId = Math.floor(Math.random() * 50) + 1;
    const url = `https://dummyjson.com/recipes/${randomId}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch meal.');
            }
            return response.json();
        })
        .then(mealData => {
            // Format the meal data to be displayed
            const mealHTML = `
                <div class="meal-suggestion">
                    <h3>${mealData.name}</h3>
                    <div class="meal-details">
                        <p><strong>Cuisine:</strong> ${mealData.cuisine}</p>
                        <p><strong>Cooking Time:</strong> ${mealData.cookTimeMinutes} minutes</p>
                        <p><strong>Calories per serving:</strong> ${mealData.caloriesPerServing}</p>
                        <p><strong>Ingredients:</strong></p>
                        <ul>
                            ${mealData.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            mealSuggestionDiv.innerHTML = mealHTML;
        })
        .catch(error => {
            mealSuggestionDiv.innerHTML = `<p class="error">Failed to retrive meal details. Please try again.</p>`;
            console.error('Error retriving meal:', error);
        });
};