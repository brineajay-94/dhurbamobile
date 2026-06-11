const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

const sheets = {
  products: [
    ['id','name','brand','category','image','price','oldPrice','stock','featured','description','url','specs','cropX','cropY','cropW','cropH','createdAt']
  ],
  banners: [
    ['id','image','title','description','ctaText','ctaLink','active','order','cropX','cropY','cropW','cropH']
  ],
  sliders: [
    ['id','image','title','subtitle','link','active','order']
  ],
  promotions: [
    ['id','image','title','description','link','active','order']
  ],
  brands: [
    ['id','name','image','active','order']
  ],
  subBanners: [
    ['id','image','title','description','active','order']
  ],
  notifications: [
    ['id','title','message','date','time','timestamp']
  ],
  repairs: [
    ['id','customer','device','issue','phone','cost','status','date']
  ],
  settings: [
    ['key','value']
  ],
  users: [
    ['id','email','password']
  ]
};

for (const [name, data] of Object.entries(sheets)) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = data[0].map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, name);
}

XLSX.writeFile(wb, 'Dhurba-sheet.xlsx');
console.log('Dhurba-sheet.xlsx created with 10 sheets');
