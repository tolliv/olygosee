if (navigator.storage && navigator.storage.estimate)
{
  navigator.storage.estimate().then(estimate =>
  {
    const used = (estimate.usage / (1024 * 1024)).toFixed(2);
    const quota = (estimate.quota / (1024 * 1024)).toFixed(2);
    console.log(`Utilisé : ${used} Mo sur un quota de ${quota} Mo`);
  });
}