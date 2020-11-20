# Compiley
Compile data from multiple sources to produce work report

# Parsers
- [x] getMeta - get known tables
  - [x] metaUsers(source): { source: id } mapping
  - [x] metaJobs: { product: id } mapping
  - [x] metaTypes: { name: id } mapping
- [x] get list of files we need to process
  - [ ] add file name checker - they need to be unique
    - [ ] add first folder checker - needs to follow a pattern (to be defined)
  - [x] get created, modified timestamp, set current timestamp
  - [x] match filename with known source list
    - [x] file created lower, modified higher - check & replace
      - [ ] figure out some type of check for this
    - [x] file created equal or higher, modified higher - replace
    - [x] what to do if we have more than one same filename as source?
      - [x] first folder within data (so, data/something) should be captured and added to name (data-18-01/file.xls)
- [ ] parseDTI
  - [x] handle meta vs db sate
    - [x] drop source from db if it's already known source (cascade drop for related entries)
    - [x] check if known user (set John Doe for unkowns), get id
      - [ ] better handling for unknown users (ignore currently)
    - [x] check if known job (if not: add to db, update metaJobs), get id
    - [x] check if known type (if not: throw an error, should be defined upfront), get id
    - [x] check if known day (if not: add to db), get id
  - [x] handle standard images
    - [x] set d_type 4 in first go (will be read from claro logs or assumed)
  - [x] handle automatic images
    - [x] set d_type 4 in first go (will be read from claro logs or assumed)
  - [x] handle cutout images
    - [x] solve duration for cutout images
    - [x] d_type = 0 (read from source)
  - [x] end of file db housekeeping
    - [x] reduce jobsAtomic by day / job / source / type / user into job
    - [x] insert new jobs, get id
    - [x] update jobsAtomic with valid id, insert into db
- [x] parseClaroManual
  - [x] write results to helperClaro table
- [ ] parseClaro
  - [ ] link with new Claro API
  - [ ] figure out a way to know which data to request
- [x] parse EasyJob
  - [x] figure out which xls colum links to which db table row
  - [x] handle standard images
  - [x] handle cutout images
  - [x] handle montage
  - [x] handle various extra work
  - [x] handle weird edge cases
  - [x] convert hours to MS
  - [x] set defalut amount to 1
  - [x] set defalut duration to 0
- [x] parse Worktime
  - [x] solve rediculous excel format
  - [x] solve changes in date/time format
  - [x] db transaction
- [x] parse Administracija
  - [x] import from google sheets
  - [x] solve nightmare
- [x] parse Parte
  - [x] collect data, user is null
  - [x] insert one new job per day, get id
  - [x] assign job ID to jobsAtomic, insert transaction

# DB housekeeping
- [x] helperClaro match with jobsAtomic DTI
  - [x] standard
  - [x] automatic
- [ ] helperClaro match with jobs EasyJob
- [ ] days summify
  - [x] sum_images
  - [x] sum_users
  - [x] sum_images_atomic
  - [x] sum_users_atomic
  - [x] sum_d_working
  - [ ] sum_d_presence
  - [x] resummify days
  - [ ] report problem inputs
    - [ ] ignore first in month double inputs

# Main logic
- [x] Controller input
  - [x] get excel files from folder
  - [x] get administration from google sheets
  - [x] get claro from api
- [ ] Controller output
  - [ ] define API endpoints
  - [ ] link to excel query

# GUI
- [x] switch to electron-builder
  - [x] fix dependencies
- [x] basic layout
  - [x] start/stop button
  - [x] message display via IPC
  - [x] make event emitter from controller/parsers
  - [x] clear output
  - [x] check db button
    - [ ] report anything wrong in db
    - [ ] report what is missing
- [ ] configuration modal
  - [ ] path to excel files
    - [ ] check for expected subfolders?
  - [ ] url for administration
  - [ ] url for claro
- [ ] information modal
  - [ ] connect excel to api guide

# DB Check - Error reporting
- [ ] jobsAtomic have 0 duration
  - [ ] DTI - meaning we forgot to assign somewhere
- [ ] jobs have 0 duration or 0 amount
  - [ ] easyjob - report error in data input (which file, day, user, product)
  - [ ] administration - report error in data input (which day, user, product)
  - [ ] anything else should be handled
  - [ ] dti - report error, we forgot to delete this entry when switching types in jobsAtomic
- [ ] days
  - [ ] determine minimum for days sums
- [ ] check if data is missing
  - [ ] determine minimum for each data source

# Popravci
- [ ] claro inspector / automatic - informacije po user/danu original i kalkulirano vrijeme
- [ ] api broj slika po satu (iz jobsAtomica i helperClara)
- [ ] dodat nekako preracunavanje vremena (provjera koja je prije bila, koja smanjuje vrijeme ovisno o prisustvu)