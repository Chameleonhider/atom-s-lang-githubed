require("./file2.sl");

typedef struct{
	client, name, build_color, obj, team, game, score, process_packet, models,
	Join, On_Spawn_Menu, Join_Team, Add_Score,
	Get_Item_Selection, Selected_Items, Items, item, may_equip, may_unequip, equip, unequip, Set_Color,
	Set_Mouse_Click, left_click, right_click, On_Left_Click_Change, On_Right_Click_Change, menu_mode, Set_Menu_Mode,
	On_Key_Change,
	On_Chat, On_Command, Send_Chat,
	Build_Block, Break_Block,
	Hit, On_Hit, Hurt, Kill, Die, Unspawn,
	Spawn, Get_Respawn_Time, Respawn, Create_Spawn_Call, spawn_call, ingame,
	Delete,
	__teleport_on_click, __selected_useracc %for commands.sl
}Player_t;

define Player_SentChat(this, message){
	variable packet=packettypes->ChatPacket;
	variable ret;
	if(message[0]!='/'){
		ret=player.On_Chat(message);
		if(ret!=NULL){
			if(strlen(ret)){
				variable msg=sprintf("<%S>%S", player.name, ret);
				()=printf("%S\n", msg);
				if(player.team!=NULL){
					variable col=player.team.color;
					packet.color=((128+(((col>>16)&255)/2))<<16) | ((128+(((col>>8)&255)/2))<<8) | (128+(col&255)/2);
				}
				else{
					packet.color=0x00a0a0a0;
				}
				packet.message=msg;
				player.client.server.Packet_Broadcast(packet);
			}
		}
	}
	else{
		()=printf("<%S>%S\n", player.name, message);
		ret=player.On_Command(message[[1:]]);
		if(ret!=NULL){
			variable retmsg=sprintf("%S -> %S", message, ret);
			()=printf("[COMMAND]%S\n", retmsg);
			packet.message=retmsg;
			packet.color=0x00a0a0a0;
			Net_SendPacket(player.client, packet);
		}
		else{
			()=printf("[COMMAND]No return value\n");
		}
	}
	return 1;
}
