#!/bin/sh

if [ -z "$1" ]
  then
    echo "Put your name in as a parameter to setup ssh keys"
	read -n 1 -s -r -p "Press any key to continue"
	exit
fi

echo "make request for new ec2"
instance_id=$(aws ec2 run-instances --image-id ami-4e79ed36 --count 1 --instance-type t2.micro --key-name amazon1 --security-groups dokku-security-group --query 'Instances[*].InstanceId' --output text) 

echo "wait for ${instance_id} to be running"
aws ec2 wait instance-running --instance-ids $instance_id

echo "wait for ${instance_id} to be status ok. This might take a while..."
aws ec2 wait instance-status-ok --instance-ids $instance_id

echo "tag ${instance_id} to start"
aws ec2 create-tags --resources $instance_id --tags Key=Name,Value=LeanLedger-Prod-Cli

dns=$(aws ec2 describe-instances --instance-ids $instance_id --query 'Reservations[].Instances[].PublicDnsName' --output text)

echo "ssh to ${dns} to setup dokku"
ssh-keyscan $dns >> ~/.ssh/known_hosts
ssh -i "~/.ssh/amazon1.pem" ubuntu@$dns << EOF
wget https://raw.githubusercontent.com/dokku/dokku/v0.11.6/bootstrap.sh
sudo DOKKU_TAG=v0.11.6 bash bootstrap.sh
exit
EOF

echo "copy public keys dokku-$1"
cat ~/.ssh/id_rsa.pub | ssh -i ~/.ssh/amazon1.pem ubuntu@$dns "sudo sshcommand acl-add dokku dokku-$1"
cat ~/.ssh/id_rsa.pub | ssh -i ~/.ssh/amazon1.pem ubuntu@$dns "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

echo "go to ${dns} and click finish setup"
read -n 1 -s -r -p "Press any key to continue"

echo "set remote url and push master"
git remote set-url deploy dokku@$dns:leanledger
git push deploy master

echo "setup mongo"
ssh ubuntu@$dns << EOF
sudo dokku plugin:install https://github.com/dokku/dokku-mongo.git mongo
dokku mongo:create leanledger
dokku mongo:link leanledger leanledger
exit
EOF

echo "setup S3"
ssh ubuntu@$dns << EOF
dokku mongo:backup-auth leanledger AKIAJVRMNV5QE3WNWJYA mJh1fdRcF2UVwU0YKvOPPVyNvMIZB6LQMfpt2Lpl
exit
EOF

echo "backup previous environment"
current_prod_dns=$(aws ec2 describe-instances --filters Name=tag:Name,Values=Prod --query 'Reservations[].Instances[].PublicDnsName' --output text)

ssh ubuntu@$current_prod_dns << EOF
dokku mongo:backup leanledger leanledger-backup
exit
EOF

echo "go to S3 and rename to latest_prod.tgz"
read -n 1 -s -r -p "Press any key to continue"

echo "download backup and upload to new server"
aws s3 cp s3://leanledger-backup/latest_prod.tgz latest_prod.tgz
tar -xvf latest_prod.tgz
scp -r backup/export ubuntu@$dns:~/

ssh ubuntu@$dns << EOF
dokku mongo:import leanledger < export
rm export
exit
EOF

ip=$(aws ec2 describe-instances --instance-ids $instance_id --query 'Reservations[].Instances[].PublicIpAddress' --output text)
echo "go to godaddy and set new ${ip} and wait 600 seconds"
read -n 1 -s -r -p "Press any key to continue"

ssh ubuntu@$dns << EOF
dokku domains:set leanledger joewebdev.com
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
dokku config:set --no-restart leanledger DOKKU_LETSENCRYPT_EMAIL=jcutrono@gmail.com
dokku letsencrypt leanledger
dokku letsencrypt:cron-job --add
dokku letsencrypt:auto-renew leanledger
exit
EOF

echo "stop current Prod"
current_prod_instanceid=$(aws ec2 describe-instances --filters Name=tag:Name,Values=Prod --query 'Reservations[].Instances[].InstanceId' --output text)
aws ec2 create-tags --resources $current_prod_instanceid --tags Key=Name,Value=Prod-old
aws ec2 stop-instances --instance-ids $current_prod_instanceid

echo "rename Prod-Cli to Prod"
aws ec2 create-tags --resources $instance_id --tags Key=Name,Value=Prod

echo "all done"