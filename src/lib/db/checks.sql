-- nadji korisnike po danima koji nemaju nista upisano da su radili
-- 1800 sec = pol sata, zna se prelit kad se noćna radi
-- metaUser 6 = Dejan
SELECT worktime.*,
       days.*,
       metaUsers.name
  FROM worktime
       LEFT JOIN
       days ON worktime.days = days.id
       LEFT JOIN
       metaUsers ON worktime.metaUsers = metaUsers.id
 WHERE d_working IS NULL AND 
       d_presence > 0 AND 
       metaUsers IS NOT 6 AND 
       d_presence > 1800;


