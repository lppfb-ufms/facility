package com.facility.dto;

import com.facility.model.NomePopular;
import com.facility.model.Organismo;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;
import java.util.stream.Collectors;

public class OrganismoDTO {

  private String id;
  private String especie;
  private String origem;
  private String familia;

  @JsonManagedReference
  List<NomePopular> nomesPopulares;

  public OrganismoDTO(Organismo organismo) {
    this.id = organismo.getId();
    this.especie = organismo.getEspecie();
    this.origem = organismo.getOrigem();
    this.familia = organismo.getFamilia();
    this.nomesPopulares = organismo
      .getNomesPopulares()
      .stream()
      .collect(Collectors.toList());
  }

  public OrganismoDTO() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getEspecie() {
    return especie;
  }

  public void setEspecie(String especie) {
    this.especie = especie;
  }

  public String getOrigem() {
    return origem;
  }

  public void setOrigem(String origem) {
    this.origem = origem;
  }

  public String getFamilia() {
    return familia;
  }

  public void setFamilia(String familia) {
    this.familia = familia;
  }

  public List<NomePopular> getNomesPopulares() {
    return nomesPopulares;
  }

  public void setNomesPopulares(List<NomePopular> nomesPopulares) {
    this.nomesPopulares = nomesPopulares;
  }
}
