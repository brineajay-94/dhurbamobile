const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

const sheets = {
  users: [
    ['id','email','password','role','name','phone','createdAt']
  ],
  products: [
    ['id','name','brand','category','image','price','oldPrice','stock','featured','description','url','specs','createdAt']
  ],
  repairs: [
    ['id','customer','device','issue','phone','cost','status','date','userId','createdAt']
  ],
  activity: [
    ['id','action','entity','name','admin','time','date','timestamp']
  ]
};

for (const [name, data] of Object.entries(sheets)) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = data[0].map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, name);
}

XLSX.writeFile(wb, 'Dhurba-sheet.xlsx');
console.log('Dhurba-sheet.xlsx created with ' + Object.keys(sheets).length + ' sheets (users, products, repairs, activity)');
